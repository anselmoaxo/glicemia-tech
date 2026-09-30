"use client";

import { inviteFamily, type InviteState } from "@/app/(app)/compartilhar/actions";
import { useFormAction } from "@/lib/use-form-action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SHARE_MODULES } from "@/lib/sharing/modules";

export function InviteForm() {
  const [state, action, pending] = useFormAction<InviteState>(inviteFamily, {});
  return (
    <form onSubmit={action} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="email" className="text-base">E-mail do familiar</Label>
        <Input id="email" name="email" type="email" autoComplete="off" required className="h-12 text-base" />
      </div>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-lg font-medium">O que ele pode ver (somente leitura)</legend>
        {SHARE_MODULES.map((m) => (
          <label key={m.key} className="flex min-h-12 items-center gap-3 text-base">
            <input type="checkbox" name="modules" value={m.key} className="size-6" />
            {m.label}
          </label>
        ))}
      </fieldset>
      {state.error && <p role="alert" className="text-base font-medium text-destructive">{state.error}</p>}
      {state.ok && (
        <div role="status" className="flex flex-col gap-2 text-base">
          <p className="font-medium">
            {state.emailSent
              ? "Convite enviado por e-mail."
              : "Convite criado, mas o e-mail não pôde ser enviado. Envie este link ao familiar:"}
          </p>
          {state.link && <p className="break-all rounded-lg border p-3 text-sm">{state.link}</p>}
        </div>
      )}
      <Button type="submit" disabled={pending} className="h-14 text-lg">
        {pending ? "Enviando..." : "Enviar convite"}
      </Button>
    </form>
  );
}
