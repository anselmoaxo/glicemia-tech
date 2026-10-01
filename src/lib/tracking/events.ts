import "server-only";
import { and, desc, eq, gte, inArray } from "drizzle-orm";
import { db } from "@/db";
import { glucoseReadings, medicationLogs, planEvents } from "@/db/schema";
import { EARLY_WINDOW_MIN } from "./slots";

export type EventView = {
  id: string;
  kind: "missed_measurement" | "med_unconfirmed";
  slotAt: Date;
  /** texto que distingue o que é fato do que é só falta de confirmação */
  label: string;
  resolved: boolean;
};

/**
 * Histórico de verificações do plano. Cada linha diz o que se sabe: lembrete enviado, medição registrada,
 * medicamento registrado (tomou / não tomou) ou sem confirmação. Falta de confirmação não prova nada.
 */
export async function listPlanEvents(userId: string, limit = 15): Promise<EventView[]> {
  const rows = await db.select().from(planEvents).where(eq(planEvents.userId, userId)).orderBy(desc(planEvents.createdAt)).limit(limit);
  if (rows.length === 0) return [];

  const oldest = new Date(Math.min(...rows.map((r) => r.slotAt.getTime())) - EARLY_WINDOW_MIN * 60_000);
  const meds = rows.filter((r) => r.kind === "med_unconfirmed").map((r) => r.slotAt);
  const [readings, logs] = await Promise.all([
    db.select({ t: glucoseReadings.measuredAt }).from(glucoseReadings).where(and(eq(glucoseReadings.userId, userId), gte(glucoseReadings.measuredAt, oldest))).limit(500),
    meds.length
      ? db.select({ at: medicationLogs.scheduledFor, status: medicationLogs.status }).from(medicationLogs).where(and(eq(medicationLogs.userId, userId), inArray(medicationLogs.scheduledFor, meds)))
      : Promise.resolve([]),
  ]);

  return rows.map((r) => {
    const base = { id: r.id, kind: r.kind as EventView["kind"], slotAt: r.slotAt };
    if (r.kind === "missed_measurement") {
      const from = r.slotAt.getTime() - EARLY_WINDOW_MIN * 60_000;
      const done = readings.some((x) => x.t.getTime() >= from);
      if (done) return { ...base, label: "Medição registrada", resolved: true };
    } else {
      const log = logs.find((l) => l.at.getTime() === r.slotAt.getTime());
      if (log) {
        return { ...base, label: log.status === "taken" ? "Medicamento registrado como tomado" : "Medicamento registrado como não tomado", resolved: true };
      }
    }
    return { ...base, label: r.status === "reminder_sent" ? "Lembrete enviado · sem confirmação" : "Sem confirmação", resolved: false };
  });
}

/** Ocorrências ainda sem confirmação nas últimas `hours` horas (para o aviso dentro do app). */
export async function listOpenEvents(userId: string, hours = 24) {
  const since = Date.now() - hours * 60 * 60 * 1000;
  return (await listPlanEvents(userId, 5)).filter((e) => !e.resolved && e.slotAt.getTime() >= since);
}
