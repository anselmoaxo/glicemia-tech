import "server-only";
import { eq } from "drizzle-orm";
import { Resend } from "resend";
import { db } from "@/db";
import { emailLogs } from "@/db/schema";
import type { EmailCategory } from "@/lib/email-categories";
import { maskEmail } from "@/lib/privacy/mask";

export const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** O envio por e-mail está configurado? (há chave do Resend) */
export const emailConfigured = () => Boolean(process.env.RESEND_API_KEY);

const DEFAULT_FROM = "Glicose Tech <onboarding@resend.dev>";

/** Remetente configurado; vazio ou só espaços (e aspas sobrando) caem no remetente de teste do Resend. */
export function resolveFrom(raw: string | undefined) {
  const v = (raw ?? "").trim().replace(/^["']|["']$/g, "").trim();
  return v === "" ? DEFAULT_FROM : v;
}

/** Dados para o histórico de envios: tipo, motivo e dono. Nunca o conteúdo da mensagem. */
export type EmailMeta = {
  userId?: string | null;
  category: EmailCategory;
  reason: string;
  /** mesma chave = o provedor não envia duas vezes (tentativas repetidas não duplicam a mensagem) */
  idempotencyKey?: string;
};

async function openLog(to: string, meta: EmailMeta) {
  try {
    const [row] = await db
      .insert(emailLogs)
      .values({ userId: meta.userId ?? null, category: meta.category, reason: meta.reason.slice(0, 120), recipientMasked: maskEmail(to) })
      .returning({ id: emailLogs.id });
    return row.id;
  } catch {
    return null; // o histórico nunca impede o envio
  }
}

async function closeLog(id: string | null, patch: Partial<typeof emailLogs.$inferInsert>) {
  if (!id) return;
  try {
    await db.update(emailLogs).set(patch).where(eq(emailLogs.id, id));
  } catch {
    // ignorado de propósito
  }
}

/**
 * Envia e-mail via Resend. Retorna false (sem lançar) se não configurado ou se falhar.
 * Quando falha, registra SÓ o motivo (tipo, código e mensagem do Resend): nunca o destinatário,
 * o assunto nem o corpo, que podem conter dados de saúde.
 * Com `meta`, grava no histórico (destinatário mascarado, status e id do provedor, sem conteúdo).
 */
export async function sendEmail(to: string, subject: string, html: string, text?: string, meta?: EmailMeta) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return false;
  const logId = meta ? await openLog(to, meta) : null;
  try {
    const from = resolveFrom(process.env.EMAIL_FROM);
    const { data, error } = await new Resend(key).emails.send(
      { from, to, subject, html, ...(text ? { text } : {}) },
      meta?.idempotencyKey ? { idempotencyKey: meta.idempotencyKey } : undefined,
    );
    if (error) {
      console.error(`[email] recusado pelo Resend: ${error.name} (${error.statusCode ?? "sem código"}): ${error.message}`);
      await closeLog(logId, { status: "failed", error: `${error.name} (${error.statusCode ?? "?"})`.slice(0, 80) });
      return false;
    }
    await closeLog(logId, { status: "sent", sentAt: new Date(), providerId: data?.id ?? null });
    return true;
  } catch (e) {
    console.error(`[email] falha ao chamar o Resend: ${e instanceof Error ? e.name : "erro desconhecido"}`);
    await closeLog(logId, { status: "failed", error: "Falha ao chamar o provedor" });
    return false;
  }
}
