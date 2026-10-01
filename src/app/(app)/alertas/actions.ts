"use server";

import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { alertSettings, reminders } from "@/db/schema";
import { MAX_REMINDERS, validateReminder } from "@/lib/alerts/reminders";
import { validateRange, type RangeValidation } from "@/lib/alerts/range";
import { uuidSchema } from "@/lib/glucose/validation";
import { getProfile } from "@/lib/profile";
import { requireUser } from "@/lib/session";

export type RangeState = { ok?: boolean; errors?: RangeValidation["errors"] };
export type ReminderState = { ok?: boolean; error?: string };

// Toda leitura e escrita filtra por userId da sessão: ninguém mexe nas configurações de outra conta.

export async function saveRange(_: RangeState, formData: FormData): Promise<RangeState> {
  const user = await requireUser();
  const r = validateRange(Object.fromEntries(formData));
  if (!r.values) return { errors: r.errors };

  const v = { rangeEnabled: r.values.enabled, lowMgDl: r.values.low, highMgDl: r.values.high, updatedAt: new Date() };
  await db
    .insert(alertSettings)
    .values({ userId: user.id, ...v })
    .onConflictDoUpdate({ target: alertSettings.userId, set: v });
  revalidatePath("/alertas");
  return { ok: true };
}

export async function clearRange(): Promise<void> {
  const user = await requireUser();
  await db.delete(alertSettings).where(eq(alertSettings.userId, user.id));
  revalidatePath("/alertas");
}

export async function saveReminder(id: string | null, _: ReminderState, formData: FormData): Promise<ReminderState> {
  const user = await requireUser();
  const { timezone } = await getProfile(user.id);
  const r = validateReminder(formData, timezone);
  if (!r.values) return { error: r.error };
  const v = { timeLocal: r.values.time, daysMask: r.values.daysMask, timezone: r.values.timezone };

  if (id) {
    if (!uuidSchema.safeParse(id).success) return { error: "Lembrete inválido." };
    // mudar horário/dia/fuso libera um novo envio no mesmo dia
    const updated = await db
      .update(reminders)
      .set({ ...v, lastSentOn: null, updatedAt: new Date() })
      .where(and(eq(reminders.id, id), eq(reminders.userId, user.id)))
      .returning({ id: reminders.id });
    if (updated.length === 0) return { error: "Lembrete não encontrado." };
  } else {
    const [{ n }] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(reminders)
      .where(eq(reminders.userId, user.id));
    if (n >= MAX_REMINDERS) return { error: `Você pode ter até ${MAX_REMINDERS} lembretes.` };
    await db.insert(reminders).values({ userId: user.id, ...v });
  }
  revalidatePath("/alertas");
  return { ok: true };
}

export async function setReminderEnabled(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = uuidSchema.safeParse(formData.get("id"));
  if (!id.success) return;
  await db
    .update(reminders)
    .set({ enabled: formData.get("enabled") === "true", lastSentOn: null, updatedAt: new Date() })
    .where(and(eq(reminders.id, id.data), eq(reminders.userId, user.id)));
  revalidatePath("/alertas");
}

export async function deleteReminder(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = uuidSchema.safeParse(formData.get("id"));
  if (!id.success) return;
  await db.delete(reminders).where(and(eq(reminders.id, id.data), eq(reminders.userId, user.id)));
  revalidatePath("/alertas");
}
