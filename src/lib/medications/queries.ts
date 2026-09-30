import "server-only";
import { and, asc, desc, eq, gte, lt } from "drizzle-orm";
import { db } from "@/db";
import { medicationLogs, medicationSchedules, medications } from "@/db/schema";
import { dayRange, dosesForDay, type ScheduleRow } from "./schedule";

// Toda consulta filtra por userId.
export const LOGS_PAGE_SIZE = 20;

export async function listMedications(userId: string) {
  const [meds, schedules] = await Promise.all([
    db
      .select()
      .from(medications)
      .where(eq(medications.userId, userId))
      .orderBy(desc(medications.active), asc(medications.name)),
    getSchedules(userId),
  ]);
  return meds.map((m) => ({ ...m, schedules: schedules.filter((s) => s.medicationId === m.id) }));
}

export async function getMedication(userId: string, id: string) {
  const [med] = await db
    .select()
    .from(medications)
    .where(and(eq(medications.id, id), eq(medications.userId, userId)));
  if (!med) return null;
  const schedules = await db
    .select()
    .from(medicationSchedules)
    .where(and(eq(medicationSchedules.medicationId, id), eq(medicationSchedules.userId, userId)));
  return { ...med, schedules };
}

/** Horários de medicamentos ativos do usuário. */
export async function getSchedules(userId: string, onlyActive = false): Promise<ScheduleRow[]> {
  const rows = await db
    .select({
      id: medicationSchedules.id,
      medicationId: medicationSchedules.medicationId,
      time: medicationSchedules.time,
      daysOfWeek: medicationSchedules.daysOfWeek,
    })
    .from(medicationSchedules)
    .innerJoin(medications, eq(medicationSchedules.medicationId, medications.id))
    .where(
      and(
        eq(medicationSchedules.userId, userId),
        onlyActive ? eq(medications.active, true) : undefined,
      ),
    );
  return rows;
}

export async function getLogsBetween(userId: string, from: Date, to: Date) {
  return db
    .select({
      medicationId: medicationLogs.medicationId,
      scheduledFor: medicationLogs.scheduledFor,
      status: medicationLogs.status,
    })
    .from(medicationLogs)
    .where(
      and(
        eq(medicationLogs.userId, userId),
        gte(medicationLogs.scheduledFor, from),
        lt(medicationLogs.scheduledFor, to),
      ),
    );
}

export async function listLogs(userId: string, page: number) {
  const rows = await db
    .select({
      id: medicationLogs.id,
      name: medications.name,
      dose: medications.dose,
      unit: medications.unit,
      scheduledFor: medicationLogs.scheduledFor,
      status: medicationLogs.status,
    })
    .from(medicationLogs)
    .innerJoin(medications, eq(medicationLogs.medicationId, medications.id))
    .where(eq(medicationLogs.userId, userId))
    .orderBy(desc(medicationLogs.scheduledFor))
    .limit(LOGS_PAGE_SIZE + 1)
    .offset((page - 1) * LOGS_PAGE_SIZE);
  return { items: rows.slice(0, LOGS_PAGE_SIZE), hasMore: rows.length > LOGS_PAGE_SIZE };
}

/** Doses de hoje com nome do medicamento e resposta já registrada. */
export async function getTodayDoses(userId: string, date: string, tz: string) {
  const { from, to } = dayRange(date, tz);
  const [schedules, logs, meds] = await Promise.all([
    getSchedules(userId, true),
    getLogsBetween(userId, from, to),
    db
      .select({ id: medications.id, name: medications.name, dose: medications.dose, unit: medications.unit })
      .from(medications)
      .where(and(eq(medications.userId, userId), eq(medications.active, true))),
  ]);
  const byId = new Map(meds.map((m) => [m.id, m]));
  return dosesForDay(schedules, date, tz).map((d) => ({
    ...d,
    med: byId.get(d.medicationId)!,
    status: logs.find(
      (l) => l.medicationId === d.medicationId && l.scheduledFor.getTime() === d.scheduledFor.getTime(),
    )?.status as "taken" | "skipped" | undefined,
  }));
}
