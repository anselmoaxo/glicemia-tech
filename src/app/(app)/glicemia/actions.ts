"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { glucoseReadings } from "@/db/schema";
import { syncReadingAlert } from "@/lib/alerts/service";
import { localToDate } from "@/lib/datetime";
import { CUSTOM_CONTEXT_KEY } from "@/lib/glucose/contexts";
import { findOrCreateCustomContext } from "@/lib/glucose/queries";
import { readingSchema, uuidSchema } from "@/lib/glucose/validation";
import { getProfile } from "@/lib/profile";
import { requireUser } from "@/lib/session";

export type ReadingState = { error?: string };

async function parseReading(userId: string, formData: FormData) {
  const parsed = readingSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message } as const;

  const v = parsed.data;
  const { timezone } = await getProfile(userId);
  const isCustom = v.contextKey === CUSTOM_CONTEXT_KEY;
  return {
    data: {
      valueMgDl: v.value,
      measuredAt: localToDate(v.date, v.time, timezone),
      contextKey: v.contextKey,
      customContextId: isCustom ? await findOrCreateCustomContext(userId, v.customContext) : null,
      notes: v.notes,
      symptoms: v.symptoms,
      activity: v.activity,
    },
  } as const;
}

export async function createReading(_: ReadingState, formData: FormData): Promise<ReadingState> {
  const user = await requireUser();
  const r = await parseReading(user.id, formData);
  if ("error" in r) return { error: r.error };

  const [created] = await db
    .insert(glucoseReadings)
    .values({ ...r.data, userId: user.id })
    .returning({ id: glucoseReadings.id });
  after(() => syncReadingAlert(user, created.id, true));
  revalidatePath("/glicemia");
  redirect("/glicemia");
}

export async function updateReading(
  id: string,
  _: ReadingState,
  formData: FormData,
): Promise<ReadingState> {
  const user = await requireUser();
  if (!uuidSchema.safeParse(id).success) return { error: "Registro inválido" };
  const r = await parseReading(user.id, formData);
  if ("error" in r) return { error: r.error };

  const updated = await db
    .update(glucoseReadings)
    .set({ ...r.data, updatedAt: new Date() })
    .where(and(eq(glucoseReadings.id, id), eq(glucoseReadings.userId, user.id)))
    .returning({ id: glucoseReadings.id });
  if (updated.length === 0) return { error: "Registro não encontrado" };
  after(() => syncReadingAlert(user, id, false));

  revalidatePath("/glicemia");
  redirect("/glicemia");
}

export async function deleteReading(formData: FormData) {
  const user = await requireUser();
  const id = uuidSchema.safeParse(formData.get("id"));
  if (!id.success) return;
  await db
    .delete(glucoseReadings)
    .where(and(eq(glucoseReadings.id, id.data), eq(glucoseReadings.userId, user.id)));
  revalidatePath("/glicemia");
}
