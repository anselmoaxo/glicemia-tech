"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { profiles, users } from "@/db/schema";
import { ageFromBirthDate, yearsToDiagnosisYear } from "@/lib/profile-utils";
import { requireUser } from "@/lib/session";
import { profileSchema } from "@/lib/validation";

export type ProfileState = { ok?: boolean; error?: string };

export async function updateProfile(_: ProfileState, formData: FormData): Promise<ProfileState> {
  const user = await requireUser();
  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { name, phone, birthDate, sex, diabetesType, yearsWithDiabetes, fontScale, alertEmailSelf, alertEmailFamily, trackingPurpose } = parsed.data;
  const diagnosisYear = yearsToDiagnosisYear(yearsWithDiabetes);

  // Menor de 18 anos: a confirmação do responsável vem por e-mail (/responsavel); aqui só se preserva ou se zera.
  const isMinor = (ageFromBirthDate(birthDate) ?? 99) < 18;
  const [current] = await db.select({ g: profiles.guardianConsentAt }).from(profiles).where(eq(profiles.userId, user.id));
  const guardianConsentAt = isMinor ? (current?.g ?? null) : null;
  await db.update(users).set({ name, updatedAt: new Date() }).where(eq(users.id, user.id));
  await db
    .insert(profiles)
    .values({ userId: user.id, phone, birthDate, sex, diabetesType, diagnosisYear, fontScale, alertEmailSelf, alertEmailFamily, trackingPurpose: trackingPurpose ?? null, guardianConsentAt })
    .onConflictDoUpdate({
      target: profiles.userId,
      set: { phone, birthDate, sex, diabetesType, diagnosisYear, fontScale, alertEmailSelf, alertEmailFamily, trackingPurpose: trackingPurpose ?? null, guardianConsentAt, updatedAt: new Date() },
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
