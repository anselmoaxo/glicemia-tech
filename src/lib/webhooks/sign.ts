import { createHmac, timingSafeEqual } from "node:crypto";

export const MAX_ATTEMPTS = 5;
const BACKOFF_SEC = [60, 300, 1800, 7200, 21600]; // 1 min, 5 min, 30 min, 2 h, 6 h

/** Espera antes da próxima tentativa (progressiva); `attempts` = tentativas já feitas. */
export const backoffMs = (attempts: number) => BACKOFF_SEC[Math.min(Math.max(attempts, 1), BACKOFF_SEC.length) - 1] * 1000;

/** Assinatura HMAC-SHA256 de `${timestamp}.${corpo}`: quem recebe confere com o segredo compartilhado. */
export const signPayload = (secret: string, timestamp: string, body: string) =>
  createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex");

export function verifySignature(secret: string, timestamp: string, body: string, signature: string) {
  const a = Buffer.from(signPayload(secret, timestamp, body));
  const b = Buffer.from(signature.replace(/^v1=/, ""));
  return a.length === b.length && timingSafeEqual(a, b);
}

export type WebhookType = "test" | "measurement_out_of_range" | "measurement_missed" | "medication_unconfirmed";

/** Corpo do evento: só o necessário. Sem nome, e-mail, valores, diagnóstico ou alimentação. */
export function buildPayload(p: { eventId: string; type: WebhookType; occurredAt: Date; profileRef: string }) {
  return JSON.stringify({
    schema: 1,
    id: p.eventId,
    type: p.type,
    occurredAt: p.occurredAt.toISOString(),
    profileRef: p.profileRef,
    ...(p.type === "test" ? { test: true } : {}),
  });
}
