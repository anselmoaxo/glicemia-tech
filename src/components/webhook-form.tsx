"use client";

import { useState, useTransition } from "react";
import { saveWebhook, testWebhook, type WebhookState } from "@/app/(app)/acompanhamento/n8n/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFormAction } from "@/lib/use-form-action";

type Props = {
  hasUrl: boolean;
  host: string | null;
  hasSecret: boolean;
  consented: boolean;
  v: { enabled: boolean; evOutOfRange: boolean; evMissedMeasure: boolean; evMedUnconfirmed: boolean; scope: string };
};

const check = "flex min-h-12 items-start gap-3 text-base";

export function WebhookForm({ hasUrl, host, hasSecret, consented, v }: Props) {
  const [state, onSubmit, pending] = useFormAction<WebhookState>(saveWebhook, {});
  const [test, setTest] = useState<WebhookState | null>(null);
  const [testing, startTest] = useTransition();

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={onSubmit} className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <Label htmlFor="url" className="text-base">URL do webhook do n8n</Label>
          <Input id="url" name="url" type="url" autoComplete="off" placeholder={hasUrl ? `Salva (${host}/…). Deixe em branco para manter.` : "https://seu-n8n.exemplo.com/webhook/…"} className="h-12 text-base" />
          <p className="text-sm text-muted-foreground">
            Só https, em domínio público. Endereços internos ou privados são recusados. A URL fica guardada cifrada no servidor e não é exibida de novo.
          </p>
        </div>

        <fieldset className="flex flex-col gap-1">
          <legend className="mb-1 text-lg font-semibold">Eventos que podem ser enviados</legend>
          <label className={check}><input type="checkbox" name="evOutOfRange" defaultChecked={v.evOutOfRange} className="mt-1 size-6" />Medição fora do parâmetro pessoal</label>
          <label className={check}><input type="checkbox" name="evMissedMeasure" defaultChecked={v.evMissedMeasure} className="mt-1 size-6" />Medição prevista sem registro (após a tolerância configurada)</label>
          <label className={check}><input type="checkbox" name="evMedUnconfirmed" defaultChecked={v.evMedUnconfirmed} className="mt-1 size-6" />Medicamento ou insulina sem confirmação</label>
        </fieldset>

        <fieldset className="flex flex-col gap-1">
          <legend className="mb-1 text-lg font-semibold">Escopo</legend>
          <label className={check}><input type="radio" name="scope" value="diabetes_only" defaultChecked={v.scope !== "profile"} className="mt-1 size-5" />Somente enquanto o acompanhamento de diabetes estiver ativo neste perfil</label>
          <label className={check}><input type="radio" name="scope" value="profile" defaultChecked={v.scope === "profile"} className="mt-1 size-5" />Este perfil individual, autorizado por mim</label>
        </fieldset>

        <div className="flex flex-col gap-2 rounded-2xl border bg-card p-4 text-base">
          <p className="font-semibold">O que é enviado, e para quê</p>
          <ul className="list-disc pl-6">
            <li>Somente: um identificador único do evento, o tipo do evento, o horário em que ocorreu e um código anônimo do perfil.</li>
            <li><strong>Não</strong> enviamos nome, e-mail, valores de glicose, diagnóstico, medicamentos ou alimentação.</li>
            <li>Finalidade: o seu fluxo no n8n (por exemplo, avisar alguém que você escolher). O app não conhece o que o seu fluxo faz depois.</li>
            <li>Cada envio é assinado com um segredo (cabeçalho <code>X-Glicose-Signature</code>) para você conferir a origem.</li>
          </ul>
          {!consented && (
            <label className={check}>
              <input type="checkbox" name="consent" className="mt-1 size-6" />
              Autorizo o envio desses dados ao endereço que informei.
            </label>
          )}
          {consented && <p className="text-sm text-muted-foreground">Autorização registrada.</p>}
        </div>

        <label className={check}><input type="checkbox" name="enabled" defaultChecked={v.enabled} className="mt-1 size-6" /><span><strong>Integração ativa</strong> (desmarque para pausar)</span></label>
        {hasSecret && <label className={check}><input type="checkbox" name="rotate" className="mt-1 size-6" />Gerar um novo segredo de assinatura (o atual deixa de valer)</label>}

        {state.error && <p role="alert" className="text-base font-medium text-destructive">{state.error}</p>}
        {state.ok && <p role="status" className="text-base font-medium">Integração salva.</p>}
        {state.newSecret && (
          <div role="status" className="rounded-2xl border-2 border-primary p-4 text-base">
            <p className="font-semibold">Segredo de assinatura (aparece só agora, copie e guarde no n8n):</p>
            <p className="mt-1 break-all font-mono text-sm">{state.newSecret}</p>
          </div>
        )}
        <Button type="submit" disabled={pending} className="h-14 text-lg">{pending ? "Salvando..." : "Salvar integração"}</Button>
      </form>

      <div className="flex flex-col gap-2 border-t pt-4">
        <p className="text-base text-muted-foreground">O teste envia um evento fictício, sem nenhum dado real de saúde.</p>
        <Button
          type="button"
          variant="outline"
          disabled={testing || !hasUrl}
          onClick={() => startTest(async () => setTest(await testWebhook()))}
          className="h-12 text-base"
        >
          {testing ? "Enviando teste..." : "Enviar evento de teste"}
        </Button>
        {test?.error && <p role="alert" className="text-base font-medium text-destructive">{test.error}</p>}
        {test?.testResult && <p role="status" className="text-base font-medium">{test.testResult}</p>}
      </div>
    </div>
  );
}
