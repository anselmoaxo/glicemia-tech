import type { EmailStatus } from "@/lib/email-categories";

// Só os estados que o Resend realmente informa. "Enviado" NÃO é "entregue": entregue só com o evento delivered.
const MAP: Record<string, EmailStatus> = {
  "email.sent": "sent",
  "email.delivered": "delivered",
  "email.delivery_delayed": "delayed",
  "email.bounced": "rejected",
  "email.complained": "rejected",
  "email.suppressed": "rejected",
  "email.failed": "failed",
};

/** Traduz o evento do provedor; eventos que não mudam a entrega (aberto, clicado...) devolvem null. */
export const statusFromEvent = (type: string): EmailStatus | null => MAP[type] ?? null;

/** Estado vindo da consulta direta (`last_event`) da API. */
export const statusFromLastEvent = (last: string): EmailStatus | null => statusFromEvent(`email.${last}`);

const RANK: Record<EmailStatus, number> = { pending: 0, unknown: 0, sent: 1, delayed: 2, delivered: 3, failed: 4, rejected: 4 };

/** Eventos podem chegar fora de ordem: nunca volta de "entregue" para "enviado", por exemplo. */
export const shouldUpdate = (current: EmailStatus, next: EmailStatus) => RANK[next] >= RANK[current] && next !== current;
