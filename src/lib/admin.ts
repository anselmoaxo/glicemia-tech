import "server-only";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { adminAuditLogs } from "@/db/schema";
import { parseAdminIds } from "@/lib/admin-ids";
import { env } from "@/lib/env";
import { getSession } from "@/lib/session";

export const isAdmin = (userId: string) => parseAdminIds(env.ADMIN_USER_IDS).has(userId);

/**
 * Exige administrador. Quem não é recebe 404 (a área não revela que existe).
 * Chame em toda página e em toda server action do /admin — o layout sozinho não basta.
 */
export async function requireAdmin() {
  const session = await getSession();
  if (!session || session.user.suspendedAt || !isAdmin(session.user.id)) notFound();
  return session.user;
}

export async function logAdminAction(
  adminId: string,
  action: "suspend" | "unsuspend" | "delete",
  targetEmail: string,
) {
  await db.insert(adminAuditLogs).values({ adminId, action, targetEmail });
}
