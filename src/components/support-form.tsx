"use client";

import { createSupportRequest, type SupportState } from "@/app/(app)/privacidade/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { SUPPORT_KINDS } from "@/lib/privacy/support";
import { useFormAction } from "@/lib/use-form-action";

const field =
  "w-full rounded-lg border border-input bg-background px-3 text-base focus-visible:outline-2 focus-visible:outline-ring";

export function SupportForm() {
  const [state, onSubmit, pending] = useFormAction<SupportState>(createSupportRequest, {});
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <Label htmlFor="kind" className="text-base">Tipo</Label>
        <select id="kind" name="kind" required className={`${field} h-12`}>
          {SUPPORT_KINDS.map((k) => (
            <option key={k.key} value={k.key}>{k.label}</option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="message" className="text-base">Mensagem</Label>
        <textarea id="message" name="message" required minLength={5} maxLength={1000} rows={4} className={`${field} py-2`} />
        <p className="text-sm text-muted-foreground">Não escreva valores de glicemia nem outros dados de saúde aqui.</p>
      </div>
      {state.error && <p role="alert" className="text-base font-medium text-destructive">{state.error}</p>}
      {state.ok && <p role="status" className="text-base font-medium">Solicitação enviada.</p>}
      <Button type="submit" disabled={pending} className="h-14 text-lg">{pending ? "Enviando..." : "Enviar solicitação"}</Button>
    </form>
  );
}
