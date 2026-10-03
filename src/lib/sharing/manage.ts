import "server-only";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { familyMembers, profiles, sharingPermissions, users } from "@/db/schema";
import { getMaxCompanions } from "@/lib/settings";
import { sharingEvent } from "./audit";
import type { ShareModule } from "./modules";
import { addDays, generateToken } from "./tokens";
import {
  INVITE_DAYS,
  isMinor,
  occupiesSlot,
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

/** Cria (ou renova) um convite. Um acesso já ativo não é reaberto: para mudar módulos use updateMemberModules. */
export async function createInvite(
  actor: { id: string; email: string },
  ownerId: string,
  input: { email: string; modules: ShareModule[] },
): Promise<Result<{ token: string; ownerName: string; days: number }>> {
  const ctx = await getSharingContext(actor.id, ownerId);
  if (!ctx?.authority.canInvite) {
    return { ok: false, error: ctx?.ownerIsMinor ? "Como o perfil é de menor de idade, só o responsável legal pode convidar." : NO_PERMISSION };
  }
  const email = input.email.trim().toLowerCase();
  if (email === ctx.owner.email.toLowerCase()) return { ok: false, error: "Não é possível convidar o próprio titular do perfil." };
  if (email === actor.email.toLowerCase()) return { ok: false, error: "Você não pode convidar a si mesmo." };

  const members = await db
    .select({ id: familyMembers.id, email: familyMembers.email, status: familyMembers.status, inviteExpiresAt: familyMembers.inviteExpiresAt })
    .from(familyMembers)
    .where(eq(familyMembers.ownerId, ownerId));
  const existing = members.find((m) => m.email === email);
  if (existing?.status === "accepted") {
    return { ok: false, error: "Esta pessoa já tem acesso. Para mudar o que ela vê, use \"Alterar o que pode ver\"." };
  }
  const max = await getMaxCompanions();
  const used = members.filter((m) => occupiesSlot(m) && m.id !== existing?.id).length;
  if (used >= max) {
    return {
      ok: false,
      error: `Limite de ${max} ${max === 1 ? "pessoa" : "pessoas"} com acesso a este perfil. Revogue um acesso ou cancele um convite pendente.`,
    };
  }

  const { token, hash } = generateToken();
  const id = existing?.id ?? crypto.randomUUID();
  const reset = {
    status: "pending",
    role: "companion",
    memberUserId: null,
    acceptedAt: null,
    revokedAt: null,
    tokenHash: hash,
    inviteExpiresAt: addDays(INVITE_DAYS),
  };
  await db.batch([
    existing
      ? db.update(familyMembers).set(reset).where(and(eq(familyMembers.id, id), eq(familyMembers.ownerId, ownerId)))
      : db.insert(familyMembers).values({ id, ownerId, email, ...reset }),
    db.delete(sharingPermissions).where(eq(sharingPermissions.familyMemberId, id)),
    db.insert(sharingPermissions).values(input.modules.map((module) => ({ familyMemberId: id, module }))),
    sharingEvent({ ownerId, actorId: actor.id, action: "invite", familyMemberId: id, memberEmail: email, modules: input.modules }),
  ]);
  return { ok: true, token, ownerName: ctx.owner.name, days: INVITE_DAYS };
}

async function getMember(ownerId: string, memberId: string) {
  const [row] = await db
    .select({ id: familyMembers.id, email: familyMembers.email, status: familyMembers.status, role: familyMembers.role })
    .from(familyMembers)
    .where(and(eq(familyMembers.id, memberId), eq(familyMembers.ownerId, ownerId)));
  return row ?? null;
}

/** Muda o que um acompanhante pode ver, sem derrubar o acesso. O responsável legal sempre vê tudo. */
export async function updateMemberModules(actorId: string, ownerId: string, memberId: string, modules: ShareModule[]): Promise<Result> {
  const ctx = await getSharingContext(actorId, ownerId);
  if (!ctx?.authority.canEditPermissions) return { ok: false, error: NO_PERMISSION };
  const member = await getMember(ownerId, memberId);
  if (!member || member.status === "revoked") return { ok: false, error: "Vínculo não encontrado." };
  if (member.role === "guardian") return { ok: false, error: "O responsável legal acompanha todos os registros do menor." };
  await db.batch([
    db.delete(sharingPermissions).where(eq(sharingPermissions.familyMemberId, member.id)),
    db.insert(sharingPermissions).values(modules.map((module) => ({ familyMemberId: member.id, module }))),
    sharingEvent({ ownerId, actorId, action: "permissions_change", familyMemberId: member.id, memberEmail: member.email, modules }),
  ]);
  return { ok: true };
}

/** Revoga um acesso ativo ou cancela um convite pendente. */
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
