import "server-only";
import { and, eq, gte, isNull } from "drizzle-orm";
import { db } from "@/db";
import { glucoseReadings, planEvents, profiles, trackingPlans, users } from "@/db/schema";
import { sendEmail } from "@/lib/email";
import { emailEnabled } from "@/lib/email-flags";
import { medUnconfirmedEmail, missedMeasureEmail } from "@/lib/email-templates";
import { env } from "@/lib/env";
import { dosesForDay, dayRange } from "@/lib/medications/schedule";
import { getLogsBetween, getSchedules } from "@/lib/medications/queries";
import { listGlucoseFamilyEmails } from "@/lib/sharing/queries";
import { emitWebhook } from "@/lib/webhooks/service";
import { dayEnabled, GRACE_MAX_MIN, isMissed, localDate, slotsForDay } from "./slots";
import { diabetesControlsVisible } from "./visibility";

const DAY = 24 * 60 * 60 * 1000;

type Row = {
  userId: string;
  email: string;
  tz: string;
  purpose: string | null;
  specificEnabled: boolean;
  daysMask: number | null;
  times: string[];
  tolerance: number | null;
  trackMedication: boolean;
  channelApp: boolean;
  emailMissed: boolean;
  emailMed: boolean;
  notifyFamily: boolean;
};

/** Registra a ocorrência UMA vez (chave única): repetir a verificação não repete o aviso. Devolve o id se for nova. */
async function claim(userId: string, kind: "missed_measurement" | "med_unconfirmed", slotKey: string, slotAt: Date) {
  const [row] = await db
    .insert(planEvents)
    .values({ userId, kind, slotKey, slotAt, status: "unconfirmed" })
    .onConflictDoNothing()
    .returning({ id: planEvents.id });
  return row?.id ?? null;
}

async function notify(r: Row, eventId: string, kind: "missed_measurement" | "med_unconfirmed") {
  let sent = r.channelApp; // o aviso no aplicativo é o próprio registro do evento
  if (emailEnabled()) {
    if (kind === "missed_measurement") {
      if (r.emailMissed) {
        const m = missedMeasureEmail({ appUrl: env.BETTER_AUTH_URL });
        sent = (await sendEmail(r.email, m.subject, m.html, m.text, { userId: r.userId, category: "medicao_esquecida", reason: "Medição prevista sem registro", idempotencyKey: `plan-${eventId}-self` })) || sent;
      }
      if (r.notifyFamily) {
        const m = missedMeasureEmail({ appUrl: env.BETTER_AUTH_URL, forFamily: true });
        for (const to of await listGlucoseFamilyEmails(r.userId)) {
          sent = (await sendEmail(to, m.subject, m.html, m.text, { userId: r.userId, category: "medicao_esquecida", reason: "Aviso a familiar autorizado", idempotencyKey: `plan-${eventId}-${to}` })) || sent;
        }
      }
    } else if (r.emailMed) {
      const m = medUnconfirmedEmail({ appUrl: env.BETTER_AUTH_URL });
      sent = (await sendEmail(r.email, m.subject, m.html, m.text, { userId: r.userId, category: "medicamento_sem_confirmacao", reason: "Medicamento sem confirmação", idempotencyKey: `plan-${eventId}-self` })) || sent;
    }
  }
  if (sent) await db.update(planEvents).set({ status: "reminder_sent" }).where(eq(planEvents.id, eventId));
  await emitWebhook(r.userId, kind === "missed_measurement" ? "measurement_missed" : "medication_unconfirmed", eventId);
}

/**
 * Verificações do plano de acompanhamento (chamado pelo agendador). Só considera quem configurou horários e tolerância,
 * respeita o fuso de cada pessoa e ignora perfis sem os controles de diabetes ativos.
 */
export async function runPlanChecks(now = new Date()) {
  const rows = await db
    .select({
      userId: trackingPlans.userId,
      email: users.email,
      tz: profiles.timezone,
      purpose: profiles.trackingPurpose,
      specificEnabled: trackingPlans.specificEnabled,
      daysMask: trackingPlans.measureDaysMask,
      times: trackingPlans.measureTimes,
      tolerance: trackingPlans.toleranceMin,
      trackMedication: trackingPlans.trackMedication,
      channelApp: trackingPlans.channelApp,
      emailMissed: trackingPlans.emailMissedMeasure,
      emailMed: trackingPlans.emailMedUnconfirmed,
      notifyFamily: trackingPlans.notifyFamily,
    })
    .from(trackingPlans)
    .innerJoin(users, and(eq(users.id, trackingPlans.userId), isNull(users.suspendedAt)))
    .innerJoin(profiles, eq(profiles.userId, trackingPlans.userId));

  let events = 0;
  for (const r of rows) {
    if (r.tolerance === null || !diabetesControlsVisible(r.purpose, r.specificEnabled)) continue;
    const dates = [...new Set([localDate(new Date(now.getTime() - DAY), r.tz), localDate(now, r.tz)])];

    if (r.times.length > 0) {
      const due = dates.flatMap((date) =>
        dayEnabled(r.daysMask, date) ? slotsForDay(date, r.times, r.tz).filter((s) => now.getTime() >= s.at.getTime() + r.tolerance! * 60_000 && now.getTime() <= s.at.getTime() + GRACE_MAX_MIN * 60_000) : [],
      );
      if (due.length > 0) {
        const recent = await db
          .select({ t: glucoseReadings.measuredAt })
          .from(glucoseReadings)
          .where(and(eq(glucoseReadings.userId, r.userId), gte(glucoseReadings.measuredAt, new Date(now.getTime() - 2 * DAY))))
          .limit(200);
        const times = recent.map((x) => x.t);
        for (const s of due) {
          if (!isMissed(s.at, r.tolerance, now, times)) continue;
          const id = await claim(r.userId, "missed_measurement", s.key, s.at);
          if (id) {
            events++;
            await notify(r, id, "missed_measurement");
          }
        }
      }
    }

    if (r.trackMedication) {
      const schedules = await getSchedules(r.userId, true);
      if (schedules.length === 0) continue;
      const logs = await getLogsBetween(r.userId, dayRange(dates[0], r.tz).from, dayRange(dates[dates.length - 1], r.tz).to);
      for (const date of dates) {
        for (const d of dosesForDay(schedules, date, r.tz)) {
          const at = d.scheduledFor.getTime();
          if (now.getTime() < at + r.tolerance * 60_000 || now.getTime() > at + GRACE_MAX_MIN * 60_000) continue;
          if (logs.some((l) => l.medicationId === d.medicationId && l.scheduledFor.getTime() === at)) continue;
          const id = await claim(r.userId, "med_unconfirmed", `med:${d.scheduleId}:${date}`, d.scheduledFor);
          if (id) {
            events++;
            await notify(r, id, "med_unconfirmed");
          }
        }
      }
    }
  }
  return events;
}
