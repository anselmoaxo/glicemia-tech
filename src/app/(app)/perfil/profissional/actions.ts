"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { professionalProfiles } from "@/db/schema";
import { professionalSchema, statusForRegistry } from "@/lib/privacy/professional";
import { requireUser } from "@/lib/session";

export type ProState = { ok?: boolean; error?: string };

/**
 * O status NUNCA vem do formulário: salvar um registro novo ou alterado volta para "pending"
 * (ou "unverified" sem registro). Só um administrador marca "verified" ou "rejected".
 */
export async function saveProfessionalProfile(_: ProState, formData: FormData): Promise<ProState> {
  const user = await requireUser();
  const parsed = professionalSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;

  const [current] = await db.select().from(professionalProfiles).where(eq(professionalProfiles.userId, user.id));
  const registryChanged =
    !current ||
    current.registryCouncil !== (d.registryCouncil ?? null) ||
    current.registryUf !== (d.registryUf ?? null) ||
    current.registryNumber !== d.registryNumber;

  const values = {
    profession: d.profession,
    registryCouncil: d.registryCouncil ?? null,
    registryUf: d.registryUf ?? null,
    registryNumber: d.registryNumber,
    bio: d.bio,
    updatedAt: new Date(),
    // mudou o registro: perde a verificação anterior
    ...(registryChanged ? { verificationStatus: statusForRegistry(d), verifiedAt: null, verifiedBy: null } : {}),
  };
  await db
    .insert(professionalProfiles)
    .values({ userId: user.id, ...values, verificationStatus: statusForRegistry(d) })
    .onConflictDoUpdate({ target: professionalProfiles.userId, set: values });
  revalidatePath("/perfil/profissional");
  return { ok: true };
}

export async function removeProfessionalProfile() {
  const user = await requireUser();
  await db.delete(professionalProfiles).where(eq(professionalProfiles.userId, user.id));
  revalidatePath("/perfil/profissional");
}
