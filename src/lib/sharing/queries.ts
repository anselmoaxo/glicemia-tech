import "server-only";
import { and, desc, eq, inArray, isNotNull, isNull, notExists } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/db";
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
    role: m.role,
    acceptedAt: m.acceptedAt,
    inviteExpiresAt: m.inviteExpiresAt,
    modules: perms.filter((p) => p.familyMemberId === m.id).map((p) => p.module),
  }));
}

// Menores de quem o usuário é responsável legal (titular suspenso não aparece: o acesso está bloqueado).
export async function listSharedWithMe(viewerId: string) {
  return db
    .select({ ownerId: familyMembers.ownerId, ownerName: users.name, role: familyMembers.role })
    .from(familyMembers)
    .innerJoin(users, eq(users.id, familyMembers.ownerId))
    .where(
      and(
        eq(familyMembers.memberUserId, viewerId),
        eq(familyMembers.status, "accepted"),
        eq(familyMembers.role, "guardian"),
        isNull(users.suspendedAt),
      ),
    )
    .orderBy(users.name);
}

export async function getOwnerName(ownerId: string) {
  const [row] = await db.select({ name: users.name }).from(users).where(eq(users.id, ownerId));
  return row?.name ?? "Usuário";
}

const owners = alias(users, "owners");

/**
 * E-mails dos responsáveis legais com acesso à glicemia (para alertas). Conta de familiar suspensa não recebe, e titular
 * suspenso não gera aviso para ninguém (o acesso dos familiares já fica bloqueado).
 */
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
        eq(familyMembers.role, "guardian"),
        eq(sharingPermissions.module, "glucose"),
        isNull(users.suspendedAt),
        notExists(db.select({ id: owners.id }).from(owners).where(and(eq(owners.id, ownerId), isNotNull(owners.suspendedAt)))),
      ),
    );
  return rows.map((r) => r.email);
}
