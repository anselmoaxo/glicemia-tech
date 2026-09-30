"use server";

import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { familyMembers } from "@/db/schema";
import { requireUser } from "@/lib/session";
import { hashToken } from "@/lib/sharing/tokens";

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
    invite.ownerId !== user.id;
  if (!valid) redirect(`/convite/${encodeURIComponent(token)}?erro=1`);

  await db
    .update(familyMembers)
    .set({ status: "accepted", memberUserId: user.id, acceptedAt: new Date() })
    .where(and(eq(familyMembers.id, invite.id), eq(familyMembers.status, "pending")));
  redirect("/familia");
}
