import "server-only";
import { desc, eq, gte, and } from "drizzle-orm";
import { db } from "@/db";
import { alerts, glucoseReadings, notifications } from "@/db/schema";
import { sendEmail } from "@/lib/email";
import { alertEmail } from "@/lib/email-templates";
import { env } from "@/lib/env";
import { classify } from "@/lib/glucose/classify";
import { getTargets } from "@/lib/glucose/queries";
import { getProfile } from "@/lib/profile";
import { listGlucoseFamilyEmails } from "@/lib/sharing/queries";
import { emitWebhook } from "@/lib/webhooks/service";

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

  // n8n (só se o usuário autorizou): o id do alerta é o id do evento, então não duplica
  await emitWebhook(owner.id, "measurement_out_of_range", alert.id);

  const profile = await getProfile(owner.id);
  const log = (recipientType: "self" | "family", ok: boolean) =>
    db.insert(notifications).values({
      userId: owner.id,
      alertId: alert.id,
      recipientType,
      status: ok ? "sent" : "failed",
    });

  const appUrl = env.BETTER_AUTH_URL;
  const direction = status; // "low" | "high"

  if (profile.alertEmailSelf) {
    const mail = alertEmail({ value: reading.value, direction, appUrl, link: `${appUrl}/glicemia` });
    await log(
      "self",
      await sendEmail(owner.email, mail.subject, mail.html, mail.text, {
        userId: owner.id,
        category: "alerta_medicao",
        reason: "Medição fora da faixa pessoal",
        idempotencyKey: `alert-${alert.id}-self`,
      }),
    );
  }

  if (profile.alertEmailFamily) {
    const mail = alertEmail({
      value: reading.value,
      direction,
      appUrl,
      ownerName: owner.name,
      link: `${appUrl}/familia/${owner.id}`,
    });
    for (const to of await listGlucoseFamilyEmails(owner.id)) {
      await log(
        "family",
        await sendEmail(to, mail.subject, mail.html, mail.text, {
          userId: owner.id,
          category: "alerta_medicao",
          reason: "Aviso a familiar autorizado",
          idempotencyKey: `alert-${alert.id}-${to}`,
        }),
      );
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
