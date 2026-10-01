import "server-only";
import { Resend } from "resend";

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

/**
 * Envia e-mail via Resend. Retorna false (sem lançar) se não configurado ou se falhar.
 * Quando falha, registra SÓ o motivo (tipo, código e mensagem do Resend): nunca o destinatário,
 * o assunto nem o corpo, que podem conter dados de saúde.
 */
export async function sendEmail(to: string, subject: string, html: string, text?: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return false;
  try {
    const from = resolveFrom(process.env.EMAIL_FROM);
    const { error } = await new Resend(key).emails.send({ from, to, subject, html, ...(text ? { text } : {}) });
    if (error) {
      console.error(`[email] recusado pelo Resend: ${error.name} (${error.statusCode ?? "sem código"}): ${error.message}`);
      return false;
    }
    return true;
  } catch (e) {
    console.error(`[email] falha ao chamar o Resend: ${e instanceof Error ? e.name : "erro desconhecido"}`);
    return false;
  }
}
