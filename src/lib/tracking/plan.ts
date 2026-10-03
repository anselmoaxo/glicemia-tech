import "server-only";
import { eq } from "drizzle-orm";
import { cache } from "react";
import { db } from "@/db";
import { profiles, trackingPlans } from "@/db/schema";
import { isActiveGuardian } from "@/lib/sharing/manage";
import { diabetesControlsVisible } from "./visibility";

export async function getPlan(userId: string) {
  const [row] = await db.select().from(trackingPlans).where(eq(trackingPlans.userId, userId));
  return row ?? null;
}

/**
 * Quem pode editar o plano de acompanhamento de `ownerId`: ele mesmo, ou o responsável legal CONFIRMADO de um menor
 * (vínculo com papel de responsável ainda ativo e dono ainda menor de 18 anos). Administradores e familiares comuns nunca editam.
 */
export async function canManagePlan(viewerId: string, ownerId: string): Promise<boolean> {
  if (viewerId === ownerId) return true;
  return isActiveGuardian(viewerId, ownerId);
}

export const getTrackingContext = cache(async (ownerId: string) => {
  const [[profile], plan] = await Promise.all([
    db.select({ purpose: profiles.trackingPurpose, alertEmailSelf: profiles.alertEmailSelf, alertEmailFamily: profiles.alertEmailFamily }).from(profiles).where(eq(profiles.userId, ownerId)),
    getPlan(ownerId),
  ]);
  const specificEnabled = plan?.specificEnabled ?? false;
  return {
    purpose: profile?.purpose ?? null,
    alertEmailSelf: profile?.alertEmailSelf ?? false,
    alertEmailFamily: profile?.alertEmailFamily ?? false,
    plan,
    diabetesVisible: diabetesControlsVisible(profile?.purpose, specificEnabled),
  };
});
