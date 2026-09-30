"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { meals } from "@/db/schema";
import { localToDate } from "@/lib/datetime";
import { uuidSchema } from "@/lib/glucose/validation";
import { mealSchema } from "@/lib/meals/validation";
import { getProfile } from "@/lib/profile";
import { requireUser } from "@/lib/session";

export type MealState = { error?: string };

async function parseMeal(userId: string, formData: FormData) {
  const parsed = mealSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message } as const;

  const v = parsed.data;
  const { timezone } = await getProfile(userId);
  return {
    data: {
      mealType: v.mealType,
      customType: v.mealType === "personalizado" ? v.customType : null,
      eatenAt: localToDate(v.date, v.time, timezone),
      description: v.description,
    },
  } as const;
}

export async function createMeal(_: MealState, formData: FormData): Promise<MealState> {
  const user = await requireUser();
  const r = await parseMeal(user.id, formData);
  if ("error" in r) return { error: r.error };

  await db.insert(meals).values({ ...r.data, userId: user.id });
  revalidatePath("/refeicoes");
  redirect("/refeicoes");
}

export async function updateMeal(id: string, _: MealState, formData: FormData): Promise<MealState> {
  const user = await requireUser();
  if (!uuidSchema.safeParse(id).success) return { error: "Registro inválido" };
  const r = await parseMeal(user.id, formData);
  if ("error" in r) return { error: r.error };

  const updated = await db
    .update(meals)
    .set({ ...r.data, updatedAt: new Date() })
    .where(and(eq(meals.id, id), eq(meals.userId, user.id)))
    .returning({ id: meals.id });
  if (updated.length === 0) return { error: "Registro não encontrado" };

  revalidatePath("/refeicoes");
  redirect("/refeicoes");
}

export async function deleteMeal(formData: FormData) {
  const user = await requireUser();
  const id = uuidSchema.safeParse(formData.get("id"));
  if (!id.success) return;
  await db.delete(meals).where(and(eq(meals.id, id.data), eq(meals.userId, user.id)));
  revalidatePath("/refeicoes");
}
