import "server-only";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { alertSettings, reminders } from "@/db/schema";
import type { RangeSettings } from "./range";

/** Sem linha = recurso desligado e sem limites (nenhum padrão é aplicado). */
export async function getRangeSettings(userId: string): Promise<RangeSettings> {
  const [row] = await db.select().from(alertSettings).where(eq(alertSettings.userId, userId));
  return { enabled: row?.rangeEnabled ?? false, low: row?.lowMgDl ?? null, high: row?.highMgDl ?? null };
}

export async function listReminders(userId: string) {
  return db
    .select({
      id: reminders.id,
      time: reminders.timeLocal,
      daysMask: reminders.daysMask,
      timezone: reminders.timezone,
      enabled: reminders.enabled,
    })
    .from(reminders)
    .where(eq(reminders.userId, userId))
    .orderBy(asc(reminders.timeLocal));
}
