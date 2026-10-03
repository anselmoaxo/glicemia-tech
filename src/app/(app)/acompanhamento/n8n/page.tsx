import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { Button } from "@/components/ui/button";
import { WebhookForm } from "@/components/webhook-form";
import { db } from "@/db";
import { webhookIntegrations } from "@/db/schema";
import { fmtDateTime } from "@/lib/admin-format";
import { requireAdmin } from "@/lib/admin";
import { listDeliveries } from "@/lib/webhooks/service";
import { removeWebhook, retryWebhook } from "./actions";

export const metadata: Metadata = { title: "Integração com o n8n" };

const TYPE = {
  test: "Teste",
  measurement_out_of_range: "Medição fora do parâmetro pessoal",
  measurement_missed: "Medição prevista sem registro",
  medication_unconfirmed: "Medicamento sem confirmação",
} as const;
const STATUS = { pending: "Aguardando nova tentativa", delivered: "Entregue", failed: "Falhou" } as const;

// Só administradores (com verificação em duas etapas); usuário comum recebe 404.
export default async function N8nPage() {
  const user = await requireAdmin();
  const [cfg] = await db.select().from(webhookIntegrations).where(eq(webhookIntegrations.userId, user.id));
  const deliveries = await listDeliveries(user.id);

  return (
    <section className="flex flex-col gap-6">
      <Link href="/acompanhamento" className="flex min-h-12 items-center text-base underline underline-offset-4">← Configurações de acompanhamento</Link>
      <h1 className="text-3xl font-bold">Integração com o n8n</h1>
      <p className="text-base text-muted-foreground">
        Envia avisos para um fluxo seu no n8n, somente para os eventos que você autorizar. Se o n8n estiver fora do ar, o app continua
        funcionando normalmente: o envio é tentado de novo algumas vezes e o resultado fica no histórico abaixo.
      </p>

      <WebhookForm
        hasUrl={Boolean(cfg?.urlEnc)}
        host={cfg?.urlHost ?? null}
        hasSecret={Boolean(cfg?.secretEnc)}
        consented={Boolean(cfg?.consentAt)}
        v={{
          enabled: cfg?.enabled ?? false,
          evOutOfRange: cfg?.evOutOfRange ?? false,
          evMissedMeasure: cfg?.evMissedMeasure ?? false,
          evMedUnconfirmed: cfg?.evMedUnconfirmed ?? false,
          scope: cfg?.scope ?? "diabetes_only",
        }}
      />

      <section aria-labelledby="entregas" className="flex flex-col gap-3">
        <h2 id="entregas" className="text-xl font-semibold">Histórico de entregas</h2>
        {deliveries.length === 0 && <p className="text-base text-muted-foreground">Nenhuma entrega ainda.</p>}
        <ul className="flex flex-col gap-2">
          {deliveries.map((d) => (
            <li key={d.id} className="flex flex-col gap-1 rounded-2xl border bg-card p-3 text-base">
              <p className="font-semibold">{TYPE[d.type as keyof typeof TYPE]}</p>
              <p className={d.status === "delivered" ? "text-ok" : d.status === "failed" ? "text-destructive" : "text-muted-foreground"}>
                {STATUS[d.status as keyof typeof STATUS]} · {d.attempts} {d.attempts === 1 ? "tentativa" : "tentativas"}
                {d.httpStatus ? ` · HTTP ${d.httpStatus}` : ""}
              </p>
              <p className="text-sm text-muted-foreground">{fmtDateTime(d.createdAt)}{d.lastError ? ` · ${d.lastError}` : ""}</p>
              {d.status === "failed" && d.type !== "test" && (
                <form action={retryWebhook}>
                  <input type="hidden" name="id" value={d.id} />
                  <Button type="submit" variant="outline" className="mt-1 h-11 text-base">Reenviar (mesmo evento, sem duplicar)</Button>
                </form>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="formato" className="flex flex-col gap-2 rounded-2xl border bg-card p-4 text-base">
        <h2 id="formato" className="text-xl font-semibold">Formato dos eventos</h2>
        <pre className="overflow-x-auto rounded-lg bg-muted p-3 text-sm">{`POST <sua URL>
Content-Type: application/json
X-Glicose-Event-Id: <uuid>
X-Glicose-Event-Type: measurement_missed
X-Glicose-Timestamp: <segundos unix>
X-Glicose-Signature: v1=<hmac-sha256 hex>

{"schema":1,"id":"<uuid>","type":"measurement_missed",
 "occurredAt":"2026-10-01T10:30:00.000Z","profileRef":"<código anônimo>"}`}</pre>
        <p>
          Assinatura: HMAC-SHA256 de <code>{"{timestamp}.{corpo}"}</code> com o seu segredo. Recuse mensagens com timestamp antigo e
          ignore um <code>id</code> já processado (os reenvios usam o mesmo id). Tipos: <code>measurement_out_of_range</code>,{" "}
          <code>measurement_missed</code>, <code>medication_unconfirmed</code> e <code>test</code>.
        </p>
      </section>

      {cfg && (
        <form action={removeWebhook} className="border-t pt-6">
          <ConfirmDeleteButton label="Remover integração" message="Remover a integração e apagar a URL e o segredo salvos?" />
        </form>
      )}
    </section>
  );
}
