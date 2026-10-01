"use client";

import { requestGuardian, type GuardianState } from "@/app/responsavel/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFormAction } from "@/lib/use-form-action";

export function GuardianForm() {
  const [state, onSubmit, pending] = useFormAction<GuardianState>(requestGuardian, {});
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <Label htmlFor="email" className="text-base">E-mail do responsável legal</Label>
      <Input id="email" name="email" type="email" required autoComplete="off" className="h-12 text-base" />
      {state.error && <p role="alert" className="text-base font-medium text-destructive">{state.error}</p>}
      {state.ok && (
        <p role="status" className="text-base font-medium">
          {state.link ? "Envio de e-mail indisponível. Passe este link ao responsável: " : "Pedido enviado. Peça ao responsável que abra o e-mail."}
          {state.link && <span className="break-all">{state.link}</span>}
        </p>
      )}
      <Button type="submit" disabled={pending} className="h-14 text-lg">{pending ? "Enviando..." : "Enviar pedido ao responsável"}</Button>
    </form>
  );
}
