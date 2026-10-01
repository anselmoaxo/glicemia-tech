import "server-only";
import { and, desc, eq, isNull, lte, or, sql } from "drizzle-orm";
import { lookup } from "node:dns";
import { request } from "node:https";
import { randomUUID } from "node:crypto";
import { db } from "@/db";
import { profiles, trackingPlans, webhookDeliveries, webhookIntegrations } from "@/db/schema";
import { decrypt, opaqueProfileId } from "@/lib/crypto";
import { diabetesControlsVisible } from "@/lib/tracking/visibility";
import { backoffMs, buildPayload, MAX_ATTEMPTS, signPayload, type WebhookType } from "./sign";
import { isPrivateIp, validateWebhookUrl } from "./url";

const TIMEOUT_MS = 5000;
const LEASE_MS = 2 * 60_000;

/** DNS validado NA HORA da conexão: impede que um domínio público passe a apontar para um endereço interno. */
const safeLookup: typeof lookup = ((hostname: string, options: unknown, cb: (...a: unknown[]) => void) => {
  lookup(hostname, { all: true, verbatim: true }, (err, addrs) => {
    if (err) return cb(err);
    if (!addrs.length || addrs.some((a) => isPrivateIp(a.address))) return cb(new Error("blocked_address"));
    if (typeof options === "object" && options && (options as { all?: boolean }).all) return cb(null, addrs);
    cb(null, addrs[0].address, addrs[0].family);
  });
}) as unknown as typeof lookup;

type SendResult = { ok: boolean; status?: number; error?: string };

function post(url: URL, body: string, headers: Record<string, string>): Promise<SendResult> {
  return new Promise((resolve) => {
    let done = false;
    const finish = (r: SendResult) => {
      if (!done) {
        done = true;
        resolve(r);
      }
    };
    const req = request(
      url,
      { method: "POST", headers: { ...headers, "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) }, lookup: safeLookup, timeout: TIMEOUT_MS },
      (res) => {
        res.resume(); // a resposta não interessa; só o status
        const status = res.statusCode ?? 0;
        finish(status >= 200 && status < 300 ? { ok: true, status } : { ok: false, status, error: `Resposta HTTP ${status}` });
      },
    );
    req.on("timeout", () => {
      req.destroy();
      finish({ ok: false, error: "Tempo esgotado" });
    });
    req.on("error", (e) => finish({ ok: false, error: e.message === "blocked_address" ? "Endereço bloqueado" : "Falha de conexão" }));
    req.end(body);
  });
}

async function getConfig(userId: string) {
  const [row] = await db.select().from(webhookIntegrations).where(eq(webhookIntegrations.userId, userId));
  return row ?? null;
}

const FLAG = {
  measurement_out_of_range: "evOutOfRange",
  measurement_missed: "evMissedMeasure",
  medication_unconfirmed: "evMedUnconfirmed",
} as const;

/** Enfileira e tenta enviar. Nunca lança: o registro da medição não depende do n8n. Chame dentro de `after()`. */
export async function emitWebhook(userId: string, type: Exclude<WebhookType, "test">, eventId: string) {
  try {
    const cfg = await getConfig(userId);
    if (!cfg || !cfg.enabled || !cfg.consentAt || !cfg.urlEnc || !cfg.secretEnc || !cfg[FLAG[type]]) return;
    if (cfg.scope === "diabetes_only") {
      const [[profile], [plan]] = await Promise.all([
        db.select({ purpose: profiles.trackingPurpose }).from(profiles).where(eq(profiles.userId, userId)),
        db.select({ s: trackingPlans.specificEnabled }).from(trackingPlans).where(eq(trackingPlans.userId, userId)),
      ]);
      if (!diabetesControlsVisible(profile?.purpose, plan?.s ?? false)) return;
    }
    // a chave única (userId, eventId) impede enfileirar o mesmo evento duas vezes
    const [row] = await db
      .insert(webhookDeliveries)
      .values({ userId, eventId, type, nextAttemptAt: new Date() })
      .onConflictDoNothing()
      .returning({ id: webhookDeliveries.id });
    if (row) await attemptDelivery(row.id);
  } catch {
    console.error("[webhook] falha ao enfileirar");
  }
}

/** Uma tentativa de entrega. A reserva (lease) impede duas execuções simultâneas da mesma entrega. */
export async function attemptDelivery(deliveryId: string): Promise<SendResult> {
  const now = new Date();
  const [d] = await db
    .update(webhookDeliveries)
    .set({ attempts: sql`${webhookDeliveries.attempts} + 1`, nextAttemptAt: new Date(now.getTime() + LEASE_MS) })
    .where(
      and(
        eq(webhookDeliveries.id, deliveryId),
        eq(webhookDeliveries.status, "pending"),
        or(isNull(webhookDeliveries.nextAttemptAt), lte(webhookDeliveries.nextAttemptAt, now)),
      ),
    )
    .returning();
  if (!d) return { ok: false, error: "Já em andamento" };

  const result = await deliver(d.userId, d.eventId, d.type as WebhookType, d.createdAt);
  const exhausted = !result.ok && d.attempts >= MAX_ATTEMPTS;
  await db
    .update(webhookDeliveries)
    .set(
      result.ok
        ? { status: "delivered", deliveredAt: new Date(), httpStatus: result.status ?? null, lastError: null, nextAttemptAt: null }
        : {
            status: exhausted ? "failed" : "pending",
            httpStatus: result.status ?? null,
            lastError: (result.error ?? "Falha").slice(0, 120),
            nextAttemptAt: exhausted ? null : new Date(Date.now() + backoffMs(d.attempts)),
          },
    )
    .where(eq(webhookDeliveries.id, d.id));
  return result;
}

async function deliver(userId: string, eventId: string, type: WebhookType, occurredAt: Date): Promise<SendResult> {
  const cfg = await getConfig(userId);
  if (!cfg || (!cfg.enabled && type !== "test") || !cfg.urlEnc || !cfg.secretEnc) return { ok: false, error: "Integração desativada" };
  const rawUrl = decrypt(cfg.urlEnc);
  const secret = decrypt(cfg.secretEnc);
  if (!rawUrl || !secret) return { ok: false, error: "Configuração ilegível: salve a URL de novo" };
  const check = validateWebhookUrl(rawUrl);
  if (!check.ok) return { ok: false, error: "URL não permitida" };

  const body = buildPayload({ eventId, type, occurredAt, profileRef: opaqueProfileId(userId) });
  const ts = Math.floor(Date.now() / 1000).toString();
  return post(check.url, body, {
    "User-Agent": "GlicoseTech-Webhook/1",
    "X-Glicose-Event-Id": eventId,
    "X-Glicose-Event-Type": type,
    "X-Glicose-Timestamp": ts,
    "X-Glicose-Signature": `v1=${signPayload(secret, ts, body)}`,
  });
}

/** Evento de teste: sem dado real de saúde. Tentativa única e imediata. */
export async function sendTest(userId: string) {
  const eventId = randomUUID();
  const [row] = await db
    .insert(webhookDeliveries)
    .values({ userId, eventId, type: "test", nextAttemptAt: new Date() })
    .returning({ id: webhookDeliveries.id });
  const r = await attemptDelivery(row.id);
  // teste não é reenviado sozinho
  await db.update(webhookDeliveries).set({ status: r.ok ? "delivered" : "failed", nextAttemptAt: null }).where(eq(webhookDeliveries.id, row.id));
  return r;
}

/** Reprocessa uma entrega que falhou, com o MESMO eventId (o n8n descarta duplicata). Só do próprio dono. */
export async function retryDelivery(userId: string, deliveryId: string) {
  const [row] = await db
    .update(webhookDeliveries)
    .set({ status: "pending", attempts: 0, nextAttemptAt: new Date(), lastError: null })
    .where(and(eq(webhookDeliveries.id, deliveryId), eq(webhookDeliveries.userId, userId), eq(webhookDeliveries.status, "failed"), sql`${webhookDeliveries.type} <> 'test'`))
    .returning({ id: webhookDeliveries.id });
  if (row) await attemptDelivery(row.id);
}

/** Chamado pelo cron: reenvia o que está pendente e vencido. */
export async function processDueDeliveries(limit = 25) {
  const due = await db
    .select({ id: webhookDeliveries.id })
    .from(webhookDeliveries)
    .where(and(eq(webhookDeliveries.status, "pending"), lte(webhookDeliveries.nextAttemptAt, new Date()), sql`${webhookDeliveries.type} <> 'test'`))
    .limit(limit);
  for (const { id } of due) await attemptDelivery(id);
  return due.length;
}

export async function listDeliveries(userId: string, limit = 20) {
  return db
    .select({
      id: webhookDeliveries.id,
      type: webhookDeliveries.type,
      status: webhookDeliveries.status,
      attempts: webhookDeliveries.attempts,
      httpStatus: webhookDeliveries.httpStatus,
      lastError: webhookDeliveries.lastError,
      createdAt: webhookDeliveries.createdAt,
      deliveredAt: webhookDeliveries.deliveredAt,
    })
    .from(webhookDeliveries)
    .where(eq(webhookDeliveries.userId, userId))
    .orderBy(desc(webhookDeliveries.createdAt))
    .limit(limit);
}

