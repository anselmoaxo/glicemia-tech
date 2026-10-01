import "server-only";
import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { db } from "@/db";
import { adminAuditLogs, users } from "@/db/schema";
import { parseAdminIds } from "@/lib/admin-ids";
import { env } from "@/lib/env";
import { getSession } from "@/lib/session";

export const isAdmin = (userId: string) => parseAdminIds(env.ADMIN_USER_IDS).has(userId);

/**
 * Exige administrador COM verificação em duas etapas ligada. Quem não é admin recebe 404 (a área não
 * revela que existe); admin sem 2FA é levado ao Perfil para ativar. Chame em toda página e em toda
 * server action do /admin: o layout sozinho não basta.
 */
export async function requireAdmin() {
  const session = await getSession();
  if (!session || session.user.suspendedAt || !isAdmin(session.user.id)) notFound();
  const [row] = await db
    .select({ twoFactorEnabled: users.twoFactorEnabled })
    .from(users)
    .where(eq(users.id, session.user.id));
  if (!row?.twoFactorEnabled) redirect("/perfil?exige2fa=1");
  return session.user;
}

export type AdminAction = "suspend" | "unsuspend" | "delete" | "request_update" | "link_revoke" | "professional_verify" | "professional_reject";

/** Trilha de auditoria: só ação, quem fez e o alvo (nunca dados de saúde). */
export async function logAdminAction(adminId: string, action: AdminAction, targetEmail: string) {
  await db.insert(adminAuditLogs).values({ adminId, action, targetEmail });
}
