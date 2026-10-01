import "server-only";
import { and, count, desc, eq, gt, gte, ilike, isNotNull, isNull, max, or, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  adminAuditLogs,
  familyMembers,
  loginAttempts,
  notifications,
  professionalProfiles,
  sessions,
  supportRequests,
  users,
} from "@/db/schema";

// Só dados de CONTA e de funcionamento do app. O painel nunca lê registros de saúde (nem contagens deles).

const DAY = 24 * 60 * 60 * 1000;
export const ADMIN_TZ = "America/Sao_Paulo";
export const USERS_PAGE_SIZE = 20;
export const AUDIT_PAGE_SIZE = 30;

export type UserFilter = "todos" | "ativos" | "pausados";
export const parseUserFilter = (v: unknown): UserFilter => (v === "ativos" || v === "pausados" ? v : "todos");

const one = async (q: Promise<{ n: number }[]>) => (await q)[0]?.n ?? 0;

export async function getOverview() {
  const now = new Date();
  const d7 = new Date(now.getTime() - 7 * DAY);
  const d30 = new Date(now.getTime() - 30 * DAY);
  const d14 = new Date(now.getTime() - 14 * DAY);

  const [total, paused, new7, new30, active7, unverified, with2fa, pendingInvites, openRequests, pendingPros, failedEmails, locked, signups, logs] =
    await Promise.all([
      one(db.select({ n: count() }).from(users)),
      one(db.select({ n: count() }).from(users).where(isNotNull(users.suspendedAt))),
      one(db.select({ n: count() }).from(users).where(gte(users.createdAt, d7))),
      one(db.select({ n: count() }).from(users).where(gte(users.createdAt, d30))),
      one(db.select({ n: sql<number>`count(distinct ${sessions.userId})::int` }).from(sessions).where(gte(sessions.updatedAt, d7))),
      one(db.select({ n: count() }).from(users).where(eq(users.emailVerified, false))),
      one(db.select({ n: count() }).from(users).where(eq(users.twoFactorEnabled, true))),
      one(db.select({ n: count() }).from(familyMembers).where(and(eq(familyMembers.status, "pending"), gt(familyMembers.inviteExpiresAt, now)))),
      one(db.select({ n: count() }).from(supportRequests).where(eq(supportRequests.status, "open"))),
      one(db.select({ n: count() }).from(professionalProfiles).where(eq(professionalProfiles.verificationStatus, "pending"))),
      one(db.select({ n: count() }).from(notifications).where(and(eq(notifications.status, "failed"), gte(notifications.createdAt, d7)))),
      one(db.select({ n: count() }).from(loginAttempts).where(gt(loginAttempts.lockedUntil, now))),
      db
        .select({ day: sql<string>`to_char(${users.createdAt} at time zone ${ADMIN_TZ}, 'YYYY-MM-DD')`, n: count() })
        .from(users)
        .where(gte(users.createdAt, d14))
        .groupBy(sql`1`),
      db
        .select({ id: adminAuditLogs.id, action: adminAuditLogs.action, targetEmail: adminAuditLogs.targetEmail, createdAt: adminAuditLogs.createdAt })
        .from(adminAuditLogs)
        .orderBy(desc(adminAuditLogs.createdAt))
        .limit(8),
    ]);

  return { total, paused, active: total - paused, new7, new30, active7, unverified, with2fa, pendingInvites, openRequests, pendingPros, failedEmails, locked, signups, logs };
}

export async function listUsers(query: string, page: number, filter: UserFilter = "todos") {
  const q = query.trim().slice(0, 80).replace(/[\\%_]/g, "\\$&");
  const where = and(
    q ? or(ilike(users.email, `%${q}%`), ilike(users.name, `%${q}%`)) : undefined,
    filter === "ativos" ? isNull(users.suspendedAt) : filter === "pausados" ? isNotNull(users.suspendedAt) : undefined,
  );
  const [rows, [{ total }]] = await Promise.all([
    db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        emailVerified: users.emailVerified,
        twoFactorEnabled: users.twoFactorEnabled,
        createdAt: users.createdAt,
        suspendedAt: users.suspendedAt,
        adminSince: users.adminSince,
        lastActive: max(sessions.updatedAt),
      })
      .from(users)
      .leftJoin(sessions, eq(sessions.userId, users.id))
      .where(where)
      .groupBy(users.id)
      .orderBy(desc(users.createdAt))
      .limit(USERS_PAGE_SIZE + 1)
      .offset((page - 1) * USERS_PAGE_SIZE),
    db.select({ total: count() }).from(users).where(where),
  ]);
  return { items: rows.slice(0, USERS_PAGE_SIZE), hasMore: rows.length > USERS_PAGE_SIZE, total };
}

export async function getUserSummary(id: string) {
  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      emailVerified: users.emailVerified,
      createdAt: users.createdAt,
      suspendedAt: users.suspendedAt,
      adminSince: users.adminSince,
      twoFactorEnabled: users.twoFactorEnabled,
    })
    .from(users)
    .where(eq(users.id, id));
  if (!user) return null;

  const [links, openRequests, activeSessions, lastActive] = await Promise.all([
    one(db.select({ n: count() }).from(familyMembers).where(eq(familyMembers.ownerId, id))),
    one(db.select({ n: count() }).from(supportRequests).where(and(eq(supportRequests.userId, id), sql`${supportRequests.status} <> 'done'`))),
    one(db.select({ n: count() }).from(sessions).where(and(eq(sessions.userId, id), gt(sessions.expiresAt, new Date())))),
    db.select({ at: max(sessions.updatedAt) }).from(sessions).where(eq(sessions.userId, id)),
  ]);

  return { ...user, familyLinks: links, openRequests, activeSessions, lastActive: lastActive[0]?.at ?? null };
}

export async function listAudit(page: number) {
  const rows = await db
    .select({ id: adminAuditLogs.id, action: adminAuditLogs.action, targetEmail: adminAuditLogs.targetEmail, createdAt: adminAuditLogs.createdAt })
    .from(adminAuditLogs)
    .orderBy(desc(adminAuditLogs.createdAt))
    .limit(AUDIT_PAGE_SIZE + 1)
    .offset((page - 1) * AUDIT_PAGE_SIZE);
  return { items: rows.slice(0, AUDIT_PAGE_SIZE), hasMore: rows.length > AUDIT_PAGE_SIZE };
}
