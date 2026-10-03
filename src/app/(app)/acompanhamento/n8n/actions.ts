"use server";

import { and, eq, gte, sql } from "drizzle-orm";
import { randomBytes } from "node:crypto";
import { lookup } from "node:dns/promises";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { webhookDeliveries, webhookIntegrations } from "@/db/schema";
import { encrypt } from "@/lib/crypto";
import { uuidSchema } from "@/lib/glucose/validation";
import { requireAdmin } from "@/lib/admin";
import { retryDelivery, sendTest } from "@/lib/webhooks/service";
import { isPrivateIp, validateWebhookUrl } from "@/lib/webhooks/url";

export type WebhookState = {
  ok?: boolean;
  error?: string;
  /** segredo novo: mostrado UMA vez, nunca mais devolvido */
  newSecret?: string;
  testResult?: string;
};

const flag = (f: FormData, k: string) => f.get(k) === "on";

/** Confere o destino também pelo DNS: o domínio não pode apontar para endereço interno. */
async function checkPublic(url: URL): Promise<string | null> {
  try {
    const addrs = await lookup(url.hostname, { all: true, verbatim: true });
    if (addrs.length === 0 || addrs.some((a) => isPrivateIp(a.address))) return "Esse endereço aponta para uma rede interna e não é permitido.";
    return null;
  } catch {
    return "Não foi possível resolver esse endereço.";
  }
}

export async function saveWebhook(_: WebhookState, formData: FormData): Promise<WebhookState> {
  const user = await requireAdmin(); // integração restrita a administradores
  const [current] = await db.select().from(webhookIntegrations).where(eq(webhookIntegrations.userId, user.id));

  const rawUrl = String(formData.get("url") ?? "").trim();
  let urlEnc = current?.urlEnc ?? null;
  let urlHost = current?.urlHost ?? null;
  if (rawUrl) {
    const v = validateWebhookUrl(rawUrl);
    if (!v.ok) return { error: v.error };
    const bad = await checkPublic(v.url);
    if (bad) return { error: bad };
    urlEnc = encrypt(v.url.toString());
    urlHost = v.url.hostname;
  }

  const enabled = flag(formData, "enabled");
  const events = { evOutOfRange: flag(formData, "evOutOfRange"), evMissedMeasure: flag(formData, "evMissedMeasure"), evMedUnconfirmed: flag(formData, "evMedUnconfirmed") };
  const scope = formData.get("scope") === "profile" ? "profile" : "diabetes_only";

  if (enabled && !urlEnc) return { error: "Informe a URL de destino para ativar." };
  if (enabled && !Object.values(events).some(Boolean)) return { error: "Escolha pelo menos um evento para enviar." };

  // Autorização explícita antes de qualquer envio: sem ela a integração não liga.
  let consentAt = current?.consentAt ?? null;
  if (enabled && !consentAt) {
    if (!flag(formData, "consent")) return { error: "Para ativar, marque a autorização do envio dos dados descritos abaixo." };
    consentAt = new Date();
  }
  if (!enabled && flag(formData, "consent") && !consentAt) consentAt = new Date();

  let secretEnc = current?.secretEnc ?? null;
  let newSecret: string | undefined;
  if (urlEnc && (!secretEnc || flag(formData, "rotate"))) {
    newSecret = randomBytes(32).toString("base64url");
    secretEnc = encrypt(newSecret);
  }

  const values = { enabled, urlEnc, urlHost, secretEnc, ...events, scope, consentAt, updatedAt: new Date() };
  await db.insert(webhookIntegrations).values({ userId: user.id, ...values }).onConflictDoUpdate({ target: webhookIntegrations.userId, set: values });
  revalidatePath("/acompanhamento/n8n");
  return { ok: true, newSecret };
}

export async function testWebhook(): Promise<WebhookState> {
  const user = await requireAdmin(); // integração restrita a administradores
  const [cfg] = await db.select({ urlEnc: webhookIntegrations.urlEnc }).from(webhookIntegrations).where(eq(webhookIntegrations.userId, user.id));
  if (!cfg?.urlEnc) return { error: "Salve a URL antes de testar." };

  const [{ n }] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(webhookDeliveries)
    .where(and(eq(webhookDeliveries.userId, user.id), eq(webhookDeliveries.type, "test"), gte(webhookDeliveries.createdAt, new Date(Date.now() - 3600_000))));
  if (n >= 5) return { error: "Limite de 5 testes por hora." };

  const r = await sendTest(user.id);
  revalidatePath("/acompanhamento/n8n");
  return r.ok ? { ok: true, testResult: "Evento de teste entregue." } : { error: `O teste falhou: ${r.error ?? "erro desconhecido"}.` };
}

export async function retryWebhook(formData: FormData) {
  const user = await requireAdmin(); // integração restrita a administradores
  const id = uuidSchema.safeParse(formData.get("id"));
  if (!id.success) return;
  await retryDelivery(user.id, id.data); // só entregas do próprio usuário
  revalidatePath("/acompanhamento/n8n");
}

export async function removeWebhook() {
  const user = await requireAdmin(); // integração restrita a administradores
  await db.delete(webhookIntegrations).where(eq(webhookIntegrations.userId, user.id));
  revalidatePath("/acompanhamento/n8n");
}
