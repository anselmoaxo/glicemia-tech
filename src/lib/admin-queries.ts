import "server-only";
import { and, count, desc, eq, gt, gte, ilike, isNotNull, isNull, max, or, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  adminAuditLogs,
  familyMembers,
  glucoseReadings,
  insulinLogs,
  meals,
  medications,
  notifications,
  sessions,
  sharedReports,
  users,
} from "@/db/schema";

// Só metadados e contagens: o painel administrativo nunca lê o conteúdo dos registros de saúde.

const DAY = 24 * 60 * 60 * 1000;
export const ADMIN_TZ = "America/Sao_Paulo";
export const USERS_PAGE_SIZE = 20;

const one = async (q: Promise<{ n: number }[]>) => (await q)[0]?.n ?? 0;

export async function getOverview() {
  const now = new Date();
  const d7 = new Date(now.getTime() - 7 * DAY);
  const d30 = new Date(now.getTime() - 30 * DAY);
  const d14 = new Date(now.getTime() - 14 * DAY);

  const [total, suspended, new7, new30, active7, readings, shareLinks, pendingInvites, failedEmails, signups, logs] =
    await Promise.all([
      one(db.select({ n: count() }).from(users)),
      one(db.select({ n: count() }).from(users).where(isNotNull(users.suspendedAt))),
      one(db.select({ n: count() }).from(users).where(gte(users.createdAt, d7))),
      one(db.select({ n: count() }).from(users).where(gte(users.createdAt, d30))),
      one(
        db
          .select({ n: sql<number>`count(distinct ${sessions.userId})::int` })
          .from(sessions)
          .where(gte(sessions.updatedAt, d7)),
      ),
      one(db.select({ n: count() }).from(glucoseReadings)),
      one(
        db
          .select({ n: count() })
          .from(sharedReports)
          .where(and(isNull(sharedReports.revokedAt), gt(sharedReports.expiresAt, now))),
      ),
      one(
        db
          .select({ n: count() })
          .from(familyMembers)
          .where(and(eq(familyMembers.status, "pending"), gt(familyMembers.inviteExpiresAt, now))),
      ),
      one(
        db
          .select({ n: count() })
          .from(notifications)
          .where(and(eq(notifications.status, "failed"), gte(notifications.createdAt, d7))),
      ),
      db
        .select({
          day: sql<string>`to_char(${users.createdAt} at time zone ${ADMIN_TZ}, 'YYYY-MM-DD')`,
          n: count(),
        })
        .from(users)
        .where(gte(users.createdAt, d14))
        .groupBy(sql`1`),
      db
        .select({
          id: adminAuditLogs.id,
          action: adminAuditLogs.action,
          targetEmail: adminAuditLogs.targetEmail,
          createdAt: adminAuditLogs.createdAt,
        })
        .from(adminAuditLogs)
        .orderBy(desc(adminAuditLogs.createdAt))
        .limit(10),
    ]);

  return { total, suspended, new7, new30, active7, readings, shareLinks, pendingInvites, failedEmails, signups, logs };
}

export async function listUsers(query: string, page: number) {
  const q = query.trim().slice(0, 80).replace(/[\\%_]/g, "\\$&");
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      createdAt: users.createdAt,
      suspendedAt: users.suspendedAt,
      lastActive: max(sessions.updatedAt),
    })
    .from(users)
    .leftJoin(sessions, eq(sessions.userId, users.id))
    .where(q ? or(ilike(users.email, `%${q}%`), ilike(users.name, `%${q}%`)) : undefined)
    .groupBy(users.id)
    .orderBy(desc(users.createdAt))
    .limit(USERS_PAGE_SIZE + 1)
    .offset((page - 1) * USERS_PAGE_SIZE);
  return { items: rows.slice(0, USERS_PAGE_SIZE), hasMore: rows.length > USERS_PAGE_SIZE };
}

export async function getUserSummary(id: string) {
  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      createdAt: users.createdAt,
      suspendedAt: users.suspendedAt,
    })
    .from(users)
    .where(eq(users.id, id));
  if (!user) return null;

  const [readings, mealsCount, meds, insulin, links, lastActive] = await Promise.all([
    one(db.select({ n: count() }).from(glucoseReadings).where(eq(glucoseReadings.userId, id))),
    one(db.select({ n: count() }).from(meals).where(eq(meals.userId, id))),
    one(db.select({ n: count() }).from(medications).where(eq(medications.userId, id))),
    one(db.select({ n: count() }).from(insulinLogs).where(eq(insulinLogs.userId, id))),
    one(db.select({ n: count() }).from(familyMembers).where(eq(familyMembers.ownerId, id))),
    db.select({ at: max(sessions.updatedAt) }).from(sessions).where(eq(sessions.userId, id)),
  ]);

  return { ...user, counts: { readings, meals: mealsCount, medications: meds, insulin, familyLinks: links }, lastActive: lastActive[0]?.at ?? null };
}
