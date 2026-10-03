import "server-only";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { Resend } from "resend";
import { db } from "@/db";
import { emailLogs } from "@/db/schema";
import type { EmailStatus } from "@/lib/email-categories";
import { shouldUpdate, statusFromLastEvent } from "@/lib/email-status";

const columns = {
  id: emailLogs.id,
  category: emailLogs.category,
  reason: emailLogs.reason,
  recipient: emailLogs.recipientMasked,
  status: emailLogs.status,
  error: emailLogs.error,
  requestedAt: emailLogs.requestedAt,
  sentAt: emailLogs.sentAt,
  providerUpdatedAt: emailLogs.providerUpdatedAt,
  hasProviderId: sql<boolean>`${emailLogs.providerId} is not null`,
};

/** Histórico do próprio usuário. Sem conteúdo da mensagem e sem identificador do provedor. */
export const listUserEmails = (userId: string, limit = 30) =>
  db.select(columns).from(emailLogs).where(eq(emailLogs.userId, userId)).orderBy(desc(emailLogs.requestedAt)).limit(limit);

/** Visão técnica do administrador: todos os usuários, só metadados (destinatário mascarado). */
export const EMAILS_PAGE_SIZE = 30;

export async function listAllEmails(page = 1) {
  const rows = await db
    .select({ ...columns, providerId: emailLogs.providerId })
    .from(emailLogs)
    .orderBy(desc(emailLogs.requestedAt))
    .limit(EMAILS_PAGE_SIZE + 1)
    .offset((page - 1) * EMAILS_PAGE_SIZE);
  return { items: rows.slice(0, EMAILS_PAGE_SIZE), hasMore: rows.length > EMAILS_PAGE_SIZE };
}

export async function emailStats(days = 7) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return db
    .select({ status: emailLogs.status, n: sql<number>`count(*)::int` })
    .from(emailLogs)
    .where(gte(emailLogs.requestedAt, since))
    .groupBy(emailLogs.status);
}

/**
 * Consulta o status atual no Resend (`last_event`) para um envio de até 3 dias. Só atualiza para um estado que o
 * provedor realmente informou; nunca marca "entregue" por dedução.
 */
export async function refreshEmailStatus(logId: string, ownerId?: string): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return false;
  const [row] = await db
    .select({ id: emailLogs.id, providerId: emailLogs.providerId, status: emailLogs.status, requestedAt: emailLogs.requestedAt })
    .from(emailLogs)
    .where(ownerId ? and(eq(emailLogs.id, logId), eq(emailLogs.userId, ownerId)) : eq(emailLogs.id, logId));
  if (!row?.providerId || Date.now() - row.requestedAt.getTime() > 3 * 24 * 60 * 60 * 1000) return false;
  try {
    const { data } = await new Resend(key).emails.get(row.providerId);
    const next = data ? statusFromLastEvent(data.last_event) : null;
    if (next && shouldUpdate(row.status as EmailStatus, next)) {
      await db.update(emailLogs).set({ status: next, providerUpdatedAt: new Date() }).where(eq(emailLogs.id, row.id));
    }
    return true;
  } catch {
    return false;
  }
}
