import "server-only";
import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { hashToken } from "./tokens";
import { familyMembers, sharingPermissions, users } from "@/db/schema";

// Vínculos que o usuário criou (ele é o dono dos dados).
export async function listFamilyMembers(ownerId: string) {
  const members = await db
    .select()
    .from(familyMembers)
    .where(eq(familyMembers.ownerId, ownerId))
    .orderBy(desc(familyMembers.createdAt));
  if (members.length === 0) return [];
  const perms = await db
    .select()
    .from(sharingPermissions)
    .where(inArray(sharingPermissions.familyMemberId, members.map((m) => m.id)));
  return members.map((m) => ({
    id: m.id,
    email: m.email,
    status: m.status,
    inviteExpiresAt: m.inviteExpiresAt,
    modules: perms.filter((p) => p.familyMemberId === m.id).map((p) => p.module),
  }));
}

// Pessoas que compartilharam dados com o usuário.
export async function listSharedWithMe(viewerId: string) {
  return db
    .select({ ownerId: familyMembers.ownerId, ownerName: users.name })
    .from(familyMembers)
    .innerJoin(users, eq(users.id, familyMembers.ownerId))
    .where(and(eq(familyMembers.memberUserId, viewerId), eq(familyMembers.status, "accepted")));
}

export async function getOwnerName(ownerId: string) {
  const [row] = await db.select({ name: users.name }).from(users).where(eq(users.id, ownerId));
  return row?.name ?? "Usuário";
}

/** E-mails de familiares aceitos com acesso à glicemia (para alertas). */
export async function listGlucoseFamilyEmails(ownerId: string) {
  const rows = await db
    .select({ email: users.email })
    .from(familyMembers)
    .innerJoin(sharingPermissions, eq(sharingPermissions.familyMemberId, familyMembers.id))
    .innerJoin(users, eq(users.id, familyMembers.memberUserId))
    .where(
      and(
        eq(familyMembers.ownerId, ownerId),
        eq(familyMembers.status, "accepted"),
        eq(sharingPermissions.module, "glucose"),
      ),
    );
  return rows.map((r) => r.email);
}

/** Convite pendente e não expirado correspondente ao token (ou null). */
export async function getUsableInvite(token: string) {
  const [invite] = await db
    .select()
    .from(familyMembers)
    .where(eq(familyMembers.tokenHash, hashToken(token)));
  if (!invite || invite.status !== "pending" || invite.inviteExpiresAt.getTime() <= Date.now()) return null;
  return invite;
}
