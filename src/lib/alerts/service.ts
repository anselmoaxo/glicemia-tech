import "server-only";
import { desc, eq, gte, and } from "drizzle-orm";
import { db } from "@/db";
import { alerts, glucoseReadings, notifications } from "@/db/schema";
import { escapeHtml, sendEmail } from "@/lib/email";
import { classify, OUT_OF_RANGE_MESSAGE } from "@/lib/glucose/classify";
import { getTargets } from "@/lib/glucose/queries";
import { getProfile } from "@/lib/profile";
import { listGlucoseFamilyEmails } from "@/lib/sharing/queries";

type Owner = { id: string; name: string; email: string };

/**
 * Cria/atualiza/remove o alerta da medição conforme as metas do usuário.
 * E-mails só são enviados na criação (isNew), respeitando as preferências.
 */
export async function syncReadingAlert(owner: Owner, readingId: string, isNew: boolean) {
  const [reading] = await db
    .select({ value: glucoseReadings.valueMgDl, contextKey: glucoseReadings.contextKey })
    .from(glucoseReadings)
    .where(and(eq(glucoseReadings.id, readingId), eq(glucoseReadings.userId, owner.id)));
  if (!reading) return;

  const status = classify(reading.value, reading.contextKey, await getTargets(owner.id));
  if (status !== "low" && status !== "high") {
    await db.delete(alerts).where(eq(alerts.readingId, readingId));
    return;
  }

  const [alert] = await db
    .insert(alerts)
    .values({ userId: owner.id, readingId, direction: status, valueMgDl: reading.value })
    .onConflictDoUpdate({
      target: alerts.readingId,
      set: { direction: status, valueMgDl: reading.value },
    })
    .returning({ id: alerts.id });
  if (!isNew) return;

  const profile = await getProfile(owner.id);
  const where = status === "low" ? "abaixo" : "acima";
  const log = (recipientType: "self" | "family", ok: boolean) =>
    db.insert(notifications).values({
      userId: owner.id,
      alertId: alert.id,
      recipientType,
      status: ok ? "sent" : "failed",
    });

  if (profile.alertEmailSelf) {
    const ok = await sendEmail(
      owner.email,
      "Glicemia fora da faixa configurada",
      `<p>Sua medição de <strong>${reading.value} mg/dL</strong> ficou ${where} da faixa que você configurou.</p>
       <p>${escapeHtml(OUT_OF_RANGE_MESSAGE)}</p>`,
    );
    await log("self", ok);
  }

  if (profile.alertEmailFamily) {
    for (const to of await listGlucoseFamilyEmails(owner.id)) {
      const ok = await sendEmail(
        to,
        `Alerta de glicemia de ${owner.name}`,
        `<p>${escapeHtml(owner.name)} registrou <strong>${reading.value} mg/dL</strong>, ${where} da faixa configurada.</p>
         <p>${escapeHtml(OUT_OF_RANGE_MESSAGE)}</p>`,
      );
      await log("family", ok);
    }
  }
}

export async function getRecentAlerts(userId: string, days = 7, limit = 5) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return db
    .select({
      id: alerts.id,
      direction: alerts.direction,
      value: alerts.valueMgDl,
      measuredAt: glucoseReadings.measuredAt,
    })
    .from(alerts)
    .innerJoin(glucoseReadings, eq(alerts.readingId, glucoseReadings.id))
    .where(and(eq(alerts.userId, userId), gte(glucoseReadings.measuredAt, since)))
    .orderBy(desc(glucoseReadings.measuredAt))
    .limit(limit);
}
