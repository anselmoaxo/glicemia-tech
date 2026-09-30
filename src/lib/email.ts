import "server-only";
import { Resend } from "resend";

export const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Envia e-mail via Resend. Retorna false (sem lançar) se não configurado ou se falhar. */
export async function sendEmail(to: string, subject: string, html: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return false;
  try {
    const from = process.env.EMAIL_FROM ?? "Glicose Tech <onboarding@resend.dev>";
    const { error } = await new Resend(key).emails.send({ from, to, subject, html });
    return !error;
  } catch {
    return false; // nunca registrar conteúdo do e-mail (dados de saúde)
  }
}
