"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { medicationLogs, medicationSchedules, medications } from "@/db/schema";
import { dateToLocalInputs, localToDate } from "@/lib/datetime";
import { uuidSchema } from "@/lib/glucose/validation";
import { doseLogSchema, medicationFormToObject, medicationSchema } from "@/lib/medications/validation";
import { getProfile } from "@/lib/profile";
import { requireUser } from "@/lib/session";

export type MedicationState = { error?: string };

function parseMedication(formData: FormData) {
  const parsed = medicationSchema.safeParse(medicationFormToObject(formData));
  return parsed.success ? { data: parsed.data } : ({ error: parsed.error.issues[0].message } as const);
}

export async function createMedication(_: MedicationState, formData: FormData): Promise<MedicationState> {
  const user = await requireUser();
  const r = parseMedication(formData);
  if ("error" in r) return { error: r.error };
  const { times, days, ...med } = r.data;

  const id = crypto.randomUUID();
  // batch = uma transação: medicamento e horários entram juntos ou nenhum entra.
  await db.batch([
    db.insert(medications).values({ ...med, id, userId: user.id }),
    db.insert(medicationSchedules).values(
      times.map((time) => ({ medicationId: id, userId: user.id, time, daysOfWeek: days })),
    ),
  ]);
  revalidatePath("/medicamentos");
  redirect("/medicamentos");
}

export async function updateMedication(
  id: string,
  _: MedicationState,
  formData: FormData,
): Promise<MedicationState> {
  const user = await requireUser();
  if (!uuidSchema.safeParse(id).success) return { error: "Registro inválido" };
  const r = parseMedication(formData);
  if ("error" in r) return { error: r.error };
  const { times, days, ...med } = r.data;

  const [owned] = await db
    .select({ id: medications.id })
    .from(medications)
    .where(and(eq(medications.id, id), eq(medications.userId, user.id)));
  if (!owned) return { error: "Medicamento não encontrado" };

  await db.batch([
    db
      .update(medications)
      .set({ ...med, updatedAt: new Date() })
      .where(and(eq(medications.id, id), eq(medications.userId, user.id))),
    db
      .delete(medicationSchedules)
      .where(and(eq(medicationSchedules.medicationId, id), eq(medicationSchedules.userId, user.id))),
    db.insert(medicationSchedules).values(
      times.map((time) => ({ medicationId: id, userId: user.id, time, daysOfWeek: days })),
    ),
  ]);
  revalidatePath("/medicamentos");
  redirect("/medicamentos");
}

export async function setMedicationActive(formData: FormData) {
  const user = await requireUser();
  const id = uuidSchema.safeParse(formData.get("id"));
  if (!id.success) return;
  await db
    .update(medications)
    .set({ active: formData.get("active") === "true", updatedAt: new Date() })
    .where(and(eq(medications.id, id.data), eq(medications.userId, user.id)));
  revalidatePath("/medicamentos");
  revalidatePath("/inicio");
}

/** Registra "Tomei"/"Não tomei". O horário é recalculado no servidor a partir do agendamento. */
export async function logDose(formData: FormData) {
  const user = await requireUser();
  const parsed = doseLogSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const { scheduleId, date, status } = parsed.data;

  const { timezone } = await getProfile(user.id);
  if (date !== dateToLocalInputs(new Date(), timezone).date) return; // só doses de hoje

  const [schedule] = await db
    .select({ medicationId: medicationSchedules.medicationId, time: medicationSchedules.time })
    .from(medicationSchedules)
    .where(and(eq(medicationSchedules.id, scheduleId), eq(medicationSchedules.userId, user.id)));
  if (!schedule) return;

  const scheduledFor = localToDate(date, schedule.time.slice(0, 5), timezone);
  await db
    .insert(medicationLogs)
    .values({ userId: user.id, medicationId: schedule.medicationId, scheduledFor, status })
    .onConflictDoUpdate({
      target: [medicationLogs.medicationId, medicationLogs.scheduledFor],
      set: { status, loggedAt: new Date() },
    });
  revalidatePath("/medicamentos");
  revalidatePath("/inicio");
}
