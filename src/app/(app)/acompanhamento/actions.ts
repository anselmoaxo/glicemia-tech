"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { profiles, trackingPlans } from "@/db/schema";
import { logAccess } from "@/lib/privacy/access-log";
import { requireUser } from "@/lib/session";
import { canManagePlan, getTrackingContext } from "@/lib/tracking/plan";
import { daysToMask, planSchema } from "@/lib/tracking/validation";
import { diabetesControlsVisible } from "@/lib/tracking/visibility";

export type PlanState = { ok?: boolean; error?: string };

/**
 * Salva o plano de acompanhamento de `ownerId` (a própria pessoa ou o responsável legal confirmado de um menor).
 * A permissão é conferida aqui, no servidor; esconder o formulário não basta.
 */
export async function savePlan(ownerId: string, _: PlanState, formData: FormData): Promise<PlanState> {
  const viewer = await requireUser();
  if (typeof ownerId !== "string" || ownerId.length > 64 || !(await canManagePlan(viewer.id, ownerId))) {
    return { error: "Você não tem permissão para alterar este plano." };
  }

  const parsed = planSchema.safeParse({
    specificEnabled: formData.get("specificEnabled") ?? undefined,
    days: formData.getAll("day"),
    times: formData.getAll("time").map(String),
    expectedPerDay: String(formData.get("expectedPerDay") ?? ""),
    toleranceMin: String(formData.get("toleranceMin") ?? ""),
    trackMedication: formData.get("trackMedication") ?? undefined,
    channelApp: formData.get("channelApp") ?? undefined,
    emailMissedMeasure: formData.get("emailMissedMeasure") ?? undefined,
    emailMedUnconfirmed: formData.get("emailMedUnconfirmed") ?? undefined,
    alertEmailSelf: formData.get("alertEmailSelf") ?? undefined,
    notifyFamily: formData.get("notifyFamily") ?? undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;

  const ctx = await getTrackingContext(ownerId);
  const visible = diabetesControlsVisible(ctx.purpose, d.specificEnabled);

  // Sem os controles de diabetes, nada de frequência, medicamentos nem avisos dessa natureza é guardado.
  const values = {
    specificEnabled: d.specificEnabled,
    measureDaysMask: visible ? daysToMask(d.days) : null,
    measureTimes: visible ? d.times : [],
    expectedPerDay: visible ? d.expectedPerDay : null,
    toleranceMin: visible ? d.toleranceMin : null,
    trackMedication: visible && d.trackMedication,
    channelApp: d.channelApp,
    emailMissedMeasure: visible && d.emailMissedMeasure,
    emailMedUnconfirmed: visible && d.emailMedUnconfirmed,
    notifyFamily: d.notifyFamily,
    updatedBy: viewer.id,
    updatedAt: new Date(),
  };
  await db.insert(trackingPlans).values({ userId: ownerId, ...values }).onConflictDoUpdate({ target: trackingPlans.userId, set: values });
  await db
    .update(profiles)
    .set({ alertEmailSelf: visible && d.alertEmailSelf, alertEmailFamily: visible && d.notifyFamily, updatedAt: new Date() })
    .where(eq(profiles.userId, ownerId));

  if (viewer.id !== ownerId) await logAccess(ownerId, viewer.id, "configuracao");
  revalidatePath("/acompanhamento");
  revalidatePath(`/familia/${ownerId}/configuracoes`);
  return { ok: true };
}
