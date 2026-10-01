import "server-only";
import { and, eq, isNotNull } from "drizzle-orm";
import { cache } from "react";
import { db } from "@/db";
import { familyMembers, guardianRequests, profiles, trackingPlans } from "@/db/schema";
import { ageFromBirthDate } from "@/lib/profile-utils";
import { diabetesControlsVisible } from "./visibility";

export async function getPlan(userId: string) {
  const [row] = await db.select().from(trackingPlans).where(eq(trackingPlans.userId, userId));
  return row ?? null;
}

/**
 * Quem pode editar o plano de acompanhamento de `ownerId`: ele mesmo, ou o responsável legal CONFIRMADO de um menor
 * (vínculo ainda ativo e dono ainda menor de 18 anos). Administradores e familiares comuns nunca editam.
 */
export async function canManagePlan(viewerId: string, ownerId: string): Promise<boolean> {
  if (viewerId === ownerId) return true;
  const [row] = await db
    .select({ birthDate: profiles.birthDate })
    .from(guardianRequests)
    .innerJoin(profiles, eq(profiles.userId, guardianRequests.minorId))
    .innerJoin(
      familyMembers,
      and(eq(familyMembers.ownerId, guardianRequests.minorId), eq(familyMembers.memberUserId, viewerId), eq(familyMembers.status, "accepted")),
    )
    .where(and(eq(guardianRequests.minorId, ownerId), eq(guardianRequests.confirmedBy, viewerId), isNotNull(guardianRequests.confirmedAt)))
    .limit(1);
  if (!row) return false;
  const age = ageFromBirthDate(row.birthDate);
  return age !== null && age < 18;
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
