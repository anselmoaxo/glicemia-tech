"use server";

import { db } from "@/db";
import { profiles } from "@/db/schema";
import { yearsToDiagnosisYear } from "@/lib/profile-utils";
import { requireUser } from "@/lib/session";
import { signUpExtrasSchema } from "@/lib/validation";

export type SignUpExtras = {
  birthDate: string;
  sex: string;
  diabetesType: string;
  yearsWithDiabetes: string;
  phone: string;
};

/** Conclui o cadastro: salva o aceite dos termos (LGPD) e os dados opcionais de saúde. */
export async function completeSignup(extras: SignUpExtras) {
  const user = await requireUser();
  const parsed = signUpExtrasSchema.safeParse(extras);
  // Os dados de saúde são opcionais: se vierem inválidos, guardamos só o consentimento.
  const d = parsed.success ? parsed.data : null;

  const data = {
    lgpdConsentAt: new Date(),
    birthDate: d?.birthDate ?? null,
    sex: d?.sex ?? null,
    diabetesType: d?.diabetesType ?? null,
    diagnosisYear: yearsToDiagnosisYear(d?.yearsWithDiabetes ?? null),
    phone: d?.phone ?? null,
  };
  await db
    .insert(profiles)
    .values({ userId: user.id, ...data })
    .onConflictDoUpdate({ target: profiles.userId, set: data });
}
