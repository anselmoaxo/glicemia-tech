"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { profiles, users } from "@/db/schema";
import { yearsToDiagnosisYear } from "@/lib/profile-utils";
import { requireUser } from "@/lib/session";
import { profileSchema } from "@/lib/validation";

export type ProfileState = { ok?: boolean; error?: string };

export async function updateProfile(_: ProfileState, formData: FormData): Promise<ProfileState> {
  const user = await requireUser();
  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { name, birthDate, sex, diabetesType, yearsWithDiabetes, fontScale, alertEmailSelf, alertEmailFamily } = parsed.data;
  const diagnosisYear = yearsToDiagnosisYear(yearsWithDiabetes);
  await db.update(users).set({ name, updatedAt: new Date() }).where(eq(users.id, user.id));
  await db
    .insert(profiles)
    .values({ userId: user.id, birthDate, sex, diabetesType, diagnosisYear, fontScale, alertEmailSelf, alertEmailFamily })
    .onConflictDoUpdate({
      target: profiles.userId,
      set: { birthDate, sex, diabetesType, diagnosisYear, fontScale, alertEmailSelf, alertEmailFamily, updatedAt: new Date() },
    });

  revalidatePath("/", "layout");
  return { ok: true };
}

/** Exclusão definitiva da conta e de todos os dados (cascade no banco) — direito da LGPD. */
export async function deleteAccount() {
  const user = await requireUser();
  await db.delete(users).where(eq(users.id, user.id));
  redirect("/login");
}
