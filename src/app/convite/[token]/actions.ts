"use server";

import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { familyMembers } from "@/db/schema";
import { emailEnabled } from "@/lib/email-flags";
import { requireUser } from "@/lib/session";
import { sharingEvent } from "@/lib/sharing/audit";
import { hashToken } from "@/lib/sharing/tokens";

/**
 * Aceite do convite pelo próprio convidado: logado, com o mesmo e-mail do convite e (com o envio de e-mail
 * configurado) com esse e-mail confirmado. Conhecer o link ou o e-mail não basta.
 */
export async function acceptInvite(token: string) {
  const user = await requireUser();
  const [invite] = await db
    .select()
    .from(familyMembers)
    .where(eq(familyMembers.tokenHash, hashToken(token)));

  const valid =
    invite &&
    invite.status === "pending" &&
    invite.inviteExpiresAt.getTime() > Date.now() &&
    invite.email === user.email.toLowerCase() &&
    invite.ownerId !== user.id &&
    (user.emailVerified || !emailEnabled());
  if (!valid) redirect(`/convite/${encodeURIComponent(token)}?erro=1`);

  await db.batch([
    db
      .update(familyMembers)
      .set({ status: "accepted", memberUserId: user.id, acceptedAt: new Date() })
      .where(and(eq(familyMembers.id, invite.id), eq(familyMembers.status, "pending"))),
    sharingEvent({ ownerId: invite.ownerId, actorId: user.id, action: "accept", familyMemberId: invite.id }),
  ]);
  redirect(`/familia/${encodeURIComponent(invite.ownerId)}`);
}
