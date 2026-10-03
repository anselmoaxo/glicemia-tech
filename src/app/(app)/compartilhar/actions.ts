"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { consentLogs, profiles } from "@/db/schema";
import { sendEmail } from "@/lib/email";
import { inviteEmail } from "@/lib/email-templates";
import { env } from "@/lib/env";
import { uuidSchema } from "@/lib/glucose/validation";
import { getProfile } from "@/lib/profile";
import { requireUser } from "@/lib/session";
import { sharingEvent } from "@/lib/sharing/audit";
import { createInvite, revokeMember, updateMemberModules } from "@/lib/sharing/manage";
import { moduleLabel, SHARE_MODULE_KEYS } from "@/lib/sharing/modules";
import { majorityStatus } from "@/lib/sharing/rules";

export type InviteState = { ok?: boolean; error?: string; link?: string; emailSent?: boolean };
export type PermissionsState = { ok?: boolean; error?: string };

// `ownerId` é o perfil cujo compartilhamento está sendo alterado: o próprio usuário ou, para o responsável legal,
// o perfil do menor. Vem do formulário, então NUNCA é confiável: manage.ts confere a permissão no banco.
const ownerIdSchema = z.string().min(1).max(64);

const modulesSchema = z.array(z.enum(SHARE_MODULE_KEYS)).min(1, "Escolha o que a pessoa pode ver");

const inviteSchema = z.object({
  email: z.string().trim().toLowerCase().email("E-mail inválido"),
  modules: modulesSchema,
});

function revalidateSharing(ownerId: string) {
  revalidatePath("/compartilhar");
  revalidatePath(`/familia/${ownerId}/compartilhamento`);
}

export async function inviteFamily(ownerId: string, _: InviteState, formData: FormData): Promise<InviteState> {
  const user = await requireUser();
  const owner = ownerIdSchema.safeParse(ownerId);
  if (!owner.success) return { error: "Perfil inválido" };
  const parsed = inviteSchema.safeParse({ email: formData.get("email"), modules: formData.getAll("modules") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const result = await createInvite({ id: user.id, email: user.email }, owner.data, parsed.data);
  if (!result.ok) return { error: result.error };

  const link = `${env.BETTER_AUTH_URL}/convite/${result.token}`;
  const mail = inviteEmail({
    ownerName: result.ownerName,
    url: link,
    appUrl: env.BETTER_AUTH_URL,
    modules: parsed.data.modules.map(moduleLabel),
    days: result.days,
  });
  const emailSent = await sendEmail(parsed.data.email, mail.subject, mail.html, mail.text, {
    userId: user.id,
    category: "convite",
    reason: "Convite para acompanhar",
  });

  revalidateSharing(owner.data);
  // sem e-mail configurado, o link (de uso único, vale só para o e-mail convidado) aparece só para quem convidou
  return { ok: true, emailSent, link: emailSent ? undefined : link };
}

export async function updatePermissions(ownerId: string, _: PermissionsState, formData: FormData): Promise<PermissionsState> {
  const user = await requireUser();
  const owner = ownerIdSchema.safeParse(ownerId);
  const id = uuidSchema.safeParse(formData.get("id"));
  if (!owner.success || !id.success) return { error: "Vínculo inválido" };
  const modules = modulesSchema.safeParse(formData.getAll("modules"));
  if (!modules.success) return { error: modules.error.issues[0].message };

  const result = await updateMemberModules(user.id, owner.data, id.data, modules.data);
  if (!result.ok) return { error: result.error };
  revalidateSharing(owner.data);
  return { ok: true };
}

export async function revokeFamilyMember(ownerId: string, formData: FormData) {
  const user = await requireUser();
  const owner = ownerIdSchema.safeParse(ownerId);
  const id = uuidSchema.safeParse(formData.get("id"));
  if (!owner.success || !id.success) return;
  await revokeMember(user.id, owner.data, id.data);
  revalidateSharing(owner.data);
}

/** Ao completar 18 anos, a própria pessoa confirma que revisou quem tem acesso (fica no histórico e nos consentimentos). */
export async function confirmMajorityReview() {
  const user = await requireUser();
  const profile = await getProfile(user.id);
  if (majorityStatus(profile.birthDate).kind !== "adult" || profile.majorityReviewedAt) return;
  await db.batch([
    db.update(profiles).set({ majorityReviewedAt: new Date(), updatedAt: new Date() }).where(eq(profiles.userId, user.id)),
    db.insert(consentLogs).values({ userId: user.id, kind: "majority_review", version: "2026-10" }),
    sharingEvent({ ownerId: user.id, actorId: user.id, action: "majority_review" }),
  ]);
  revalidatePath("/compartilhar");
  revalidatePath("/inicio");
}
