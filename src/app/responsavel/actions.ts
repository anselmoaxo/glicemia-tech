"use server";

import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { consentLogs, familyMembers, guardianRequests, profiles, sharingPermissions } from "@/db/schema";
import { sendEmail } from "@/lib/email";
import { guardianEmail } from "@/lib/email-templates";
import { env } from "@/lib/env";
import { ageFromBirthDate } from "@/lib/profile-utils";
import { requireUser } from "@/lib/session";
import { SHARE_MODULE_KEYS } from "@/lib/sharing/modules";
import { addDays, generateToken, hashToken } from "@/lib/sharing/tokens";

export type GuardianState = { ok?: boolean; error?: string; link?: string };

const REQUEST_DAYS = 7;

/** O menor informa o e-mail do responsável; o link só chega a esse e-mail. */
export async function requestGuardian(_: GuardianState, formData: FormData): Promise<GuardianState> {
  const user = await requireUser();
  const email = z.string().trim().toLowerCase().email("E-mail inválido").safeParse(formData.get("email"));
  if (!email.success) return { error: email.error.issues[0].message };
  if (email.data === user.email.toLowerCase()) return { error: "O e-mail do responsável deve ser diferente do seu." };

  // no máximo 3 pedidos por dia por conta (evita usar o app para disparar e-mails)
  const recent = await db.select({ at: guardianRequests.createdAt }).from(guardianRequests).where(eq(guardianRequests.minorId, user.id));
  if (recent.filter((r) => Date.now() - r.at.getTime() < 24 * 3600 * 1000).length >= 3) {
    return { error: "Limite de pedidos por dia atingido. Tente novamente amanhã." };
  }

  const { token, hash } = generateToken();
  await db.insert(guardianRequests).values({
    minorId: user.id,
    guardianEmail: email.data,
    tokenHash: hash,
    expiresAt: addDays(REQUEST_DAYS),
  });
  const link = `${env.BETTER_AUTH_URL}/responsavel/${token}`;
  const mail = guardianEmail({ minorName: user.name, url: link, appUrl: env.BETTER_AUTH_URL });
  const sent = await sendEmail(email.data, mail.subject, mail.html, mail.text, {
    userId: user.id,
    category: "responsavel",
    reason: "Confirmação do responsável legal",
  });
  // sem e-mail configurado, o link aparece na tela para o menor repassar ao responsável
  return { ok: true, link: sent ? undefined : link };
}

/** O responsável (conta própria, e-mail confirmado e igual ao informado) confirma. Isso libera o app ao menor. */
export async function confirmGuardian(token: string, formData: FormData) {
  const guardian = await requireUser();
  const back = `/responsavel/${encodeURIComponent(token)}?erro=1`;
  if (formData.get("declaro") !== "on") redirect(back);

  const [req] = await db.select().from(guardianRequests).where(eq(guardianRequests.tokenHash, hashToken(token)));
  const valid =
    req &&
    !req.confirmedAt &&
    req.expiresAt.getTime() > Date.now() &&
    req.guardianEmail === guardian.email.toLowerCase() &&
    guardian.emailVerified &&
    req.minorId !== guardian.id;
  if (!valid) redirect(back);

  // o responsável precisa ser maior de idade (se informou a data de nascimento no perfil)
  const [gp] = await db.select({ birthDate: profiles.birthDate }).from(profiles).where(eq(profiles.userId, guardian.id));
  const gAge = ageFromBirthDate(gp?.birthDate ?? null);
  if (gAge !== null && gAge < 18) redirect(back);

  const [existing] = await db
    .select({ id: familyMembers.id })
    .from(familyMembers)
    .where(and(eq(familyMembers.ownerId, req.minorId), eq(familyMembers.email, req.guardianEmail)));
  const linkId = existing?.id ?? crypto.randomUUID();
  const linkFields = {
    status: "accepted",
    memberUserId: guardian.id,
    acceptedAt: new Date(),
    tokenHash: generateToken().hash,
    inviteExpiresAt: new Date(),
  };

  await db.batch([
    db.update(guardianRequests).set({ confirmedAt: new Date(), confirmedBy: guardian.id }).where(eq(guardianRequests.id, req.id)),
    db.update(profiles).set({ guardianConsentAt: new Date() }).where(eq(profiles.userId, req.minorId)),
    db.insert(consentLogs).values({ userId: req.minorId, kind: "guardian", version: "2026-10" }),
    existing
      ? db.update(familyMembers).set(linkFields).where(eq(familyMembers.id, linkId))
      : db.insert(familyMembers).values({ id: linkId, ownerId: req.minorId, email: req.guardianEmail, ...linkFields }),
    db.delete(sharingPermissions).where(eq(sharingPermissions.familyMemberId, linkId)),
    db.insert(sharingPermissions).values(SHARE_MODULE_KEYS.map((module) => ({ familyMemberId: linkId, module }))),
  ]);
  redirect("/familia");
}
