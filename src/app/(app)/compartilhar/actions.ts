"use server";

import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { familyMembers, sharingPermissions } from "@/db/schema";
import { sendEmail } from "@/lib/email";
import { inviteEmail } from "@/lib/email-templates";
import { env } from "@/lib/env";
import { uuidSchema } from "@/lib/glucose/validation";
import { requireUser } from "@/lib/session";
import { moduleLabel, SHARE_MODULE_KEYS } from "@/lib/sharing/modules";
import { addDays, generateToken } from "@/lib/sharing/tokens";

export type InviteState = { ok?: boolean; error?: string; link?: string; emailSent?: boolean };

const MAX_MEMBERS = 10;
const INVITE_DAYS = 7;

const inviteSchema = z.object({
  email: z.string().trim().toLowerCase().email("E-mail inválido"),
  modules: z.array(z.enum(SHARE_MODULE_KEYS)).min(1, "Escolha o que o familiar pode ver"),
});

export async function inviteFamily(_: InviteState, formData: FormData): Promise<InviteState> {
  const user = await requireUser();
  const parsed = inviteSchema.safeParse({
    email: formData.get("email"),
    modules: formData.getAll("modules"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { email, modules } = parsed.data;

  if (email === user.email.toLowerCase()) return { error: "Você não pode convidar a si mesmo" };

  const [{ total }] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(familyMembers)
    .where(and(eq(familyMembers.ownerId, user.id), sql`${familyMembers.status} <> 'revoked'`));
  const [existing] = await db
    .select({ id: familyMembers.id })
    .from(familyMembers)
    .where(and(eq(familyMembers.ownerId, user.id), eq(familyMembers.email, email)));
  if (!existing && total >= MAX_MEMBERS) return { error: `Limite de ${MAX_MEMBERS} familiares` };

  const { token, hash } = generateToken();
  const inviteExpiresAt = addDays(INVITE_DAYS);
  const id = existing?.id ?? crypto.randomUUID();
  const reset = { status: "pending", memberUserId: null, acceptedAt: null, tokenHash: hash, inviteExpiresAt };

  await db.batch([
    existing
      ? db.update(familyMembers).set(reset).where(and(eq(familyMembers.id, id), eq(familyMembers.ownerId, user.id)))
      : db.insert(familyMembers).values({ id, ownerId: user.id, email, ...reset }),
    db.delete(sharingPermissions).where(eq(sharingPermissions.familyMemberId, id)),
    db.insert(sharingPermissions).values(modules.map((module) => ({ familyMemberId: id, module }))),
  ]);

  const link = `${env.BETTER_AUTH_URL}/convite/${token}`;
  const mail = inviteEmail({
    ownerName: user.name,
    url: link,
    appUrl: env.BETTER_AUTH_URL,
    modules: modules.map(moduleLabel),
    days: INVITE_DAYS,
  });
  const emailSent = await sendEmail(email, mail.subject, mail.html, mail.text);

  revalidatePath("/compartilhar");
  return { ok: true, emailSent, link: emailSent ? undefined : link };
}

export async function revokeFamilyMember(formData: FormData) {
  const user = await requireUser();
  const id = uuidSchema.safeParse(formData.get("id"));
  if (!id.success) return;
  await db
    .update(familyMembers)
    .set({ status: "revoked" })
    .where(and(eq(familyMembers.id, id.data), eq(familyMembers.ownerId, user.id)));
  revalidatePath("/compartilhar");
}
