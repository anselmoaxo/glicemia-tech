import "server-only";
import { and, count, desc, eq, gt, gte, ilike, isNotNull, isNull, or, sql, type SQL, type SQLWrapper } from "drizzle-orm";
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


/** Subconsulta escalar dentro de um SELECT: várias contagens numa única ida ao banco. */
const scalar = (q: SQLWrapper) => sql<number>`(${q})`.mapWith(Number);
const countIf = (cond: SQL | undefined) => sql<number>`count(*) filter (where ${cond})`.mapWith(Number);

export async function getOverview() {
  const now = new Date();
  const d7 = new Date(now.getTime() - 7 * DAY);
  const d30 = new Date(now.getTime() - 30 * DAY);
  const d14 = new Date(now.getTime() - 14 * DAY);

  // 3 consultas em paralelo (antes eram 14): as contagens vão juntas num SELECT sobre users.
  const [[counts], signups, logs] = await Promise.all([
    db
      .select({
        total: count(),
        paused: countIf(isNotNull(users.suspendedAt)),
        new7: countIf(gte(users.createdAt, d7)),
        new30: countIf(gte(users.createdAt, d30)),
        unverified: countIf(eq(users.emailVerified, false)),
        with2fa: countIf(eq(users.twoFactorEnabled, true)),
        active7: scalar(db.select({ n: sql`count(distinct ${sessions.userId})` }).from(sessions).where(gte(sessions.updatedAt, d7))),
        pendingInvites: scalar(
          db.select({ n: count() }).from(familyMembers).where(and(eq(familyMembers.status, "pending"), gt(familyMembers.inviteExpiresAt, now))),
        ),
        openRequests: scalar(db.select({ n: count() }).from(supportRequests).where(eq(supportRequests.status, "open"))),
        pendingPros: scalar(db.select({ n: count() }).from(professionalProfiles).where(eq(professionalProfiles.verificationStatus, "pending"))),
        failedEmails: scalar(
          db.select({ n: count() }).from(notifications).where(and(eq(notifications.status, "failed"), gte(notifications.createdAt, d7))),
        ),
        locked: scalar(db.select({ n: count() }).from(loginAttempts).where(gt(loginAttempts.lockedUntil, now))),
      })
      .from(users),
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

  return { ...counts, active: counts.total - counts.paused, signups, logs };
}

const usersId = sql`${sql.identifier("users")}.${sql.identifier("id")}`;

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
        // subconsulta por linha da página (usa o índice de sessions.user_id), em vez de juntar todas as sessões e agrupar
        // (o Drizzle escreve colunas sem o nome da tabela numa consulta sem join, por isso "users"."id" vai explícito)
        lastActive: sql<Date | null>`(select max(${sessions.updatedAt}) from ${sessions} where ${sessions.userId} = ${usersId})`.mapWith(
          sessions.updatedAt,
        ),
      })
      .from(users)
      .where(where)
      .orderBy(desc(users.createdAt))
      .limit(USERS_PAGE_SIZE + 1)
      .offset((page - 1) * USERS_PAGE_SIZE),
    db.select({ total: count() }).from(users).where(where),
  ]);
  return { items: rows.slice(0, USERS_PAGE_SIZE), hasMore: rows.length > USERS_PAGE_SIZE, total };
}

export async function getUserSummary(id: string) {
  // uma ida ao banco: conta e contagens de vínculos, solicitações e sessões juntas
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
      familyLinks: scalar(db.select({ n: count() }).from(familyMembers).where(eq(familyMembers.ownerId, id))),
      openRequests: scalar(
        db.select({ n: count() }).from(supportRequests).where(and(eq(supportRequests.userId, id), sql`${supportRequests.status} <> 'done'`)),
      ),
      activeSessions: scalar(db.select({ n: count() }).from(sessions).where(and(eq(sessions.userId, id), gt(sessions.expiresAt, new Date())))),
      lastActive: sql<Date | null>`(select max(${sessions.updatedAt}) from ${sessions} where ${sessions.userId} = ${id})`.mapWith(sessions.updatedAt),
    })
    .from(users)
    .where(eq(users.id, id));
  return user ?? null;
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
