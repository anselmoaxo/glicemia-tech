"use client";

import { useState } from "react";
import { useFormAction } from "@/lib/use-form-action";
import { createSharedReport, type ShareLinkState } from "@/app/(app)/relatorios/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const field =
  "h-12 w-full rounded-lg border border-input bg-background px-3 text-base focus-visible:outline-2 focus-visible:outline-ring";

export function ShareReportForm() {
  const [state, action, pending] = useFormAction<ShareLinkState>(createSharedReport, {});
  const [custom, setCustom] = useState(false);
  const [copied, setCopied] = useState(false);

  return (
    <form onSubmit={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="dias" className="text-base">Período do relatório</Label>
        <select
          id="dias"
          name={custom ? undefined : "dias"}
          defaultValue="30"
          onChange={(e) => setCustom(e.target.value === "custom")}
          className={field}
        >
          <option value="7">Últimos 7 dias</option>
          <option value="14">Últimos 14 dias</option>
          <option value="30">Últimos 30 dias</option>
          <option value="90">Últimos 90 dias</option>
          <option value="custom">Intervalo personalizado</option>
        </select>
      </div>
      {custom && (
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="from" className="text-base">De</Label>
            <Input id="from" name="from" type="date" required className="h-12 text-base" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="to" className="text-base">Até</Label>
            <Input id="to" name="to" type="date" required className="h-12 text-base" />
          </div>
        </div>
      )}
      <div className="flex flex-col gap-2">
        <Label htmlFor="validade" className="text-base">O link vale por</Label>
        <select id="validade" name="validade" defaultValue="7" className={field}>
          <option value="1">1 dia</option>
          <option value="7">7 dias</option>
          <option value="30">30 dias</option>
        </select>
      </div>
      {state.error && <p role="alert" className="text-base font-medium text-destructive">{state.error}</p>}
      {state.link && (
        <div role="status" className="flex flex-col gap-2">
          <p className="text-base font-medium">Link criado. Copie agora: ele não será mostrado novamente.</p>
          <p className="break-all rounded-lg border p-3 text-sm">{state.link}</p>
          <button
            type="button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(state.link!);
                setCopied(true);
              } catch {
                setCopied(false);
              }
            }}
            className="min-h-12 rounded-lg border-2 text-base font-medium focus-visible:outline-2 focus-visible:outline-ring"
          >
            {copied ? "Copiado!" : "Copiar link"}
          </button>
        </div>
      )}
      <Button type="submit" disabled={pending} className="h-14 text-lg">
        {pending ? "Criando..." : "Criar link para o médico"}
      </Button>
    </form>
  );
}
