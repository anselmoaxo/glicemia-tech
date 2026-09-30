"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { insulinLogs } from "@/db/schema";
import { localToDate } from "@/lib/datetime";
import { uuidSchema } from "@/lib/glucose/validation";
import { resolveInsulinType } from "@/lib/insulin/queries";
import { insulinSchema } from "@/lib/insulin/validation";
import { getProfile } from "@/lib/profile";
import { requireUser } from "@/lib/session";

export type InsulinState = { error?: string };

async function parseInsulin(userId: string, formData: FormData) {
  const parsed = insulinSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message } as const;

  const v = parsed.data;
  const insulinTypeId = await resolveInsulinType(userId, v.typeId, v.newType);
  if (!insulinTypeId) return { error: "Tipo de insulina inválido" } as const;

  const { timezone } = await getProfile(userId);
  return {
    data: {
      insulinTypeId,
      units: String(v.units),
      appliedAt: localToDate(v.date, v.time, timezone),
      mealRelation: v.mealRelation,
      site: v.site,
      notes: v.notes,
    },
  } as const;
}

export async function createInsulinLog(_: InsulinState, formData: FormData): Promise<InsulinState> {
  const user = await requireUser();
  const r = await parseInsulin(user.id, formData);
  if ("error" in r) return { error: r.error };

  await db.insert(insulinLogs).values({ ...r.data, userId: user.id });
  revalidatePath("/insulina");
  redirect("/insulina");
}

export async function updateInsulinLog(
  id: string,
  _: InsulinState,
  formData: FormData,
): Promise<InsulinState> {
  const user = await requireUser();
  if (!uuidSchema.safeParse(id).success) return { error: "Registro inválido" };
  const r = await parseInsulin(user.id, formData);
  if ("error" in r) return { error: r.error };

  const updated = await db
    .update(insulinLogs)
    .set({ ...r.data, updatedAt: new Date() })
    .where(and(eq(insulinLogs.id, id), eq(insulinLogs.userId, user.id)))
    .returning({ id: insulinLogs.id });
  if (updated.length === 0) return { error: "Registro não encontrado" };

  revalidatePath("/insulina");
  redirect("/insulina");
}

export async function deleteInsulinLog(formData: FormData) {
  const user = await requireUser();
  const id = uuidSchema.safeParse(formData.get("id"));
  if (!id.success) return;
  await db.delete(insulinLogs).where(and(eq(insulinLogs.id, id.data), eq(insulinLogs.userId, user.id)));
  revalidatePath("/insulina");
}
