import "server-only";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { sharingEvents, users } from "@/db/schema";
import { maskEmail } from "@/lib/privacy/mask";

export type SharingAction =
  | "invite"
  | "accept"
  | "permissions_change"
  | "invite_cancel"
  | "revoke"
  | "guardian_confirm"
  | "majority_review"
  | "admin_revoke";

export const SHARING_ACTION_LABEL: Record<SharingAction, string> = {
  invite: "enviou convite para",
  accept: "aceitou o convite",
  permissions_change: "alterou o que pode ver",
  invite_cancel: "cancelou o convite de",
  revoke: "revogou o acesso de",
  guardian_confirm: "confirmou ser responsável legal",
  majority_review: "revisou os acessos ao completar 18 anos",
  admin_revoke: "Administração revogou o acesso de",
};

/** Registra uma mudança no compartilhamento. Sem dado clínico: só quem, o quê, módulos e e-mail mascarado. */
export function sharingEvent(e: {
  ownerId: string;
  actorId: string | null;
  action: SharingAction;
  familyMemberId?: string | null;
  memberEmail?: string | null;
  modules?: string[] | null;
}) {
  return db.insert(sharingEvents).values({
    ownerId: e.ownerId,
    actorId: e.actorId,
    action: e.action,
    familyMemberId: e.familyMemberId ?? null,
    memberEmailMasked: e.memberEmail ? maskEmail(e.memberEmail) : null,
    modules: e.modules ?? null,
  });
}

export async function listSharingEvents(ownerId: string, limit = 30) {
  return db
    .select({
      id: sharingEvents.id,
      action: sharingEvents.action,
      actorName: users.name,
      memberEmailMasked: sharingEvents.memberEmailMasked,
      modules: sharingEvents.modules,
      createdAt: sharingEvents.createdAt,
    })
    .from(sharingEvents)
    .leftJoin(users, eq(users.id, sharingEvents.actorId))
    .where(eq(sharingEvents.ownerId, ownerId))
    .orderBy(desc(sharingEvents.createdAt))
    .limit(limit);
}
