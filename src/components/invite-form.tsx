"use client";

import { inviteFamily, type InviteState } from "@/app/(app)/compartilhar/actions";
import { useFormAction } from "@/lib/use-form-action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SHARE_MODULES } from "@/lib/sharing/modules";

/** Convite de acompanhante para o perfil `ownerId` (o próprio ou, para o responsável, o do menor). */
export function InviteForm({ ownerId, days }: { ownerId: string; days: number }) {
  const [state, action, pending] = useFormAction<InviteState>(inviteFamily.bind(null, ownerId), {});
  return (
    <form onSubmit={action} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="email" className="text-base">E-mail da pessoa convidada</Label>
        <Input id="email" name="email" type="email" autoComplete="off" required className="h-12 text-base" />
        <p className="text-sm text-muted-foreground">
          Ela precisa entrar (ou criar conta) com este e-mail e aceitar. O convite vale {days} dias e você pode cancelar antes.
        </p>
      </div>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-lg font-medium">O que ela pode ver (somente leitura)</legend>
        {SHARE_MODULES.map((m) => (
          <label key={m.key} className="flex min-h-12 items-center gap-3 text-base">
            <input type="checkbox" name="modules" value={m.key} className="size-6" />
            {m.label}
          </label>
        ))}
        <p className="text-sm text-muted-foreground">O relatório em PDF inclui só os itens marcados aqui.</p>
      </fieldset>
      {state.error && <p role="alert" className="text-base font-medium text-destructive">{state.error}</p>}
      {state.ok && (
        <div role="status" className="flex flex-col gap-2 text-base">
          <p className="font-medium">
            {state.emailSent
              ? "Convite enviado por e-mail."
              : "Convite criado, mas o e-mail não pôde ser enviado. Envie este link somente para a pessoa convidada (vale uma vez e só para o e-mail informado):"}
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
