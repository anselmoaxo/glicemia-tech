import "server-only";
import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { db } from "@/db";
import { adminAuditLogs, users } from "@/db/schema";
import { parseAdminIds } from "@/lib/admin-ids";
import { env } from "@/lib/env";
import { getSession } from "@/lib/session";

export type Role = "owner" | "admin" | "user";

/** Proprietário: está em ADMIN_USER_IDS (variável de ambiente). Só ele concede ou remove o papel de administrador. */
export const isOwner = (userId: string) => parseAdminIds(env.ADMIN_USER_IDS).has(userId);

/** Papel de uma conta, a partir do id e da data em que virou administrador (users.admin_since). */
export const roleOf = (userId: string, adminSince: Date | null | undefined): Role =>
  isOwner(userId) ? "owner" : adminSince ? "admin" : "user";

export const ROLE_LABEL: Record<Role, string> = { owner: "Proprietário", admin: "Administrador", user: "Usuário" };

export async function getRole(userId: string): Promise<Role> {
  if (isOwner(userId)) return "owner";
  const [row] = await db.select({ adminSince: users.adminSince }).from(users).where(eq(users.id, userId));
  return roleOf(userId, row?.adminSince);
}

/**
 * Exige administrador (proprietário ou administrador concedido) COM verificação em duas etapas. Quem não é recebe 404
 * (a área não revela que existe); admin sem 2FA vai ao Perfil para ativar. Chame em toda página e em toda server
 * action do /admin: o layout sozinho não basta. Guardado em cache só durante a requisição: layout e página fazem uma
 * única consulta.
 */
export const requireAdmin = cache(async () => {
  const session = await getSession();
  if (!session || session.user.suspendedAt) notFound();
  const [row] = await db
    .select({ twoFactorEnabled: users.twoFactorEnabled, adminSince: users.adminSince })
    .from(users)
    .where(eq(users.id, session.user.id));
  const role = roleOf(session.user.id, row?.adminSince);
  if (role === "user") notFound();
  if (!row?.twoFactorEnabled) redirect("/perfil?exige2fa=1");
  return { ...session.user, role };
});

/** Só o proprietário (ex.: gerenciar administradores). */
export async function requireOwner() {
  const admin = await requireAdmin();
  if (admin.role !== "owner") notFound();
  return admin;
}

export type AdminAction =
  | "suspend" | "unsuspend" | "delete" | "request_update" | "link_revoke" | "professional_verify" | "professional_reject"
  | "role_grant" | "role_revoke" | "verify_email" | "end_sessions";

/** Trilha de auditoria: só ação, quem fez e o alvo (nunca dados de saúde). */
export async function logAdminAction(adminId: string, action: AdminAction, targetEmail: string) {
  await db.insert(adminAuditLogs).values({ adminId, action, targetEmail });
}
