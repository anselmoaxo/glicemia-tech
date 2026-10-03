import "server-only";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { familyMembers, profiles, users } from "@/db/schema";
import { sharingEvent } from "./audit";
import {
  isMinor,
  sharingAuthority,
  type MemberRole,
  type SharingActor,
  type SharingAuthority,
} from "./rules";

// Toda mudança no compartilhamento passa por aqui: a permissão é conferida no servidor, em cada operação,
// a partir do banco (nunca do que a tela mostrou) e cada mudança fica no histórico (sharing_events).

async function ownerInfo(ownerId: string) {
  const [row] = await db
    .select({ name: users.name, email: users.email, suspendedAt: users.suspendedAt, birthDate: profiles.birthDate })
    .from(users)
    .leftJoin(profiles, eq(profiles.userId, users.id))
    .where(eq(users.id, ownerId));
  return row ?? null;
}

/**
 * `viewerId` é o responsável legal ativo de `ownerId`? Vínculo com papel de responsável, aceito, titular não suspenso e
 * ainda menor de 18 anos. Ser familiar não basta.
 */
export async function isActiveGuardian(viewerId: string, ownerId: string): Promise<boolean> {
  if (viewerId === ownerId) return false;
  const [row] = await db
    .select({ birthDate: profiles.birthDate })
    .from(familyMembers)
    .innerJoin(users, eq(users.id, familyMembers.ownerId))
    .innerJoin(profiles, eq(profiles.userId, familyMembers.ownerId))
    .where(
      and(
        eq(familyMembers.ownerId, ownerId),
        eq(familyMembers.memberUserId, viewerId),
        eq(familyMembers.status, "accepted"),
        eq(familyMembers.role, "guardian"),
        isNull(users.suspendedAt),
      ),
    )
    .limit(1);
  return Boolean(row) && isMinor(row.birthDate);
}

export type SharingContext = {
  actor: SharingActor;
  ownerIsMinor: boolean;
  authority: SharingAuthority;
  owner: { name: string; email: string };
};

/** Quem é `viewerId` em relação ao compartilhamento de `ownerId` e o que pode fazer. null = sem acesso nenhum. */
export async function getSharingContext(viewerId: string, ownerId: string): Promise<SharingContext | null> {
  const owner = await ownerInfo(ownerId);
  if (!owner || owner.suspendedAt) return null;
  const ownerIsMinor = isMinor(owner.birthDate ?? null);
  const actor: SharingActor =
    viewerId === ownerId ? "owner" : (await isActiveGuardian(viewerId, ownerId)) ? "guardian" : "none";
  const authority = sharingAuthority(actor, ownerIsMinor);
  if (!authority.canView) return null;
  return { actor, ownerIsMinor, authority, owner: { name: owner.name, email: owner.email } };
}

type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };

const NO_PERMISSION = "Você não tem permissão para alterar este compartilhamento.";

async function getMember(ownerId: string, memberId: string) {
  const [row] = await db
    .select({ id: familyMembers.id, email: familyMembers.email, status: familyMembers.status, role: familyMembers.role })
    .from(familyMembers)
    .where(and(eq(familyMembers.id, memberId), eq(familyMembers.ownerId, ownerId)));
  return row ?? null;
}

/** Revoga um acesso ativo (ex.: o antigo responsável, depois dos 18 anos) ou cancela um convite pendente antigo. */
export async function revokeMember(actorId: string, ownerId: string, memberId: string): Promise<Result> {
  const ctx = await getSharingContext(actorId, ownerId);
  const member = await getMember(ownerId, memberId);
  if (!ctx || !member || member.status === "revoked") return { ok: false, error: "Vínculo não encontrado." };
  if (!ctx.authority.canRevoke(member.role as MemberRole)) {
    return {
      ok: false,
      error:
        member.role === "guardian"
          ? "O acesso do responsável legal não pode ser revogado enquanto o titular for menor de idade. Fale com o suporte se houver um problema."
          : NO_PERMISSION,
    };
  }
  await db.batch([
    db
      .update(familyMembers)
      .set({ status: "revoked", revokedAt: new Date() })
      .where(and(eq(familyMembers.id, member.id), eq(familyMembers.ownerId, ownerId))),
    sharingEvent({
      ownerId,
      actorId,
      action: member.status === "pending" ? "invite_cancel" : "revoke",
      familyMemberId: member.id,
      memberEmail: member.email,
    }),
  ]);
  return { ok: true };
}
