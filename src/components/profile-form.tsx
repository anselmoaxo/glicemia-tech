"use client";

import { useActionState } from "react";
import { updateProfile, type ProfileState } from "@/app/(app)/perfil/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  name: string;
  email: string;
  birthDate: string | null;
  diabetesType: string | null;
  fontScale: number;
  alertEmailSelf: boolean;
  alertEmailFamily: boolean;
};

const selectClass =
  "h-12 w-full rounded-lg border border-input bg-background px-3 text-base focus-visible:outline-2 focus-visible:outline-ring";

export function ProfileForm(p: Props) {
  const [state, action, pending] = useActionState<ProfileState, FormData>(updateProfile, {});
  return (
    <form action={action} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name" className="text-base">Nome</Label>
        <Input id="name" name="name" defaultValue={p.name} className="h-12 text-base" required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="email" className="text-base">E-mail</Label>
        <Input id="email" value={p.email} className="h-12 text-base" disabled readOnly />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="birthDate" className="text-base">Data de nascimento (opcional)</Label>
        <Input id="birthDate" name="birthDate" type="date" defaultValue={p.birthDate ?? ""} className="h-12 text-base" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="diabetesType" className="text-base">Tipo de diabetes (opcional)</Label>
        <select id="diabetesType" name="diabetesType" defaultValue={p.diabetesType ?? "nao_informado"} className={selectClass}>
          <option value="nao_informado">Prefiro não informar</option>
          <option value="tipo1">Tipo 1</option>
          <option value="tipo2">Tipo 2</option>
          <option value="gestacional">Gestacional</option>
          <option value="outro">Outro</option>
        </select>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="fontScale" className="text-base">Tamanho do texto</Label>
        <select id="fontScale" name="fontScale" defaultValue={p.fontScale} className={selectClass}>
          <option value={100}>Normal</option>
          <option value={125}>Grande</option>
          <option value={150}>Muito grande</option>
        </select>
      </div>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-lg font-medium">Alertas por e-mail (valor fora da faixa)</legend>
        <label className="flex min-h-12 items-center gap-3 text-base">
          <input type="checkbox" name="alertEmailSelf" defaultChecked={p.alertEmailSelf} className="size-6" />
          Avisar a mim
        </label>
        <label className="flex min-h-12 items-center gap-3 text-base">
          <input type="checkbox" name="alertEmailFamily" defaultChecked={p.alertEmailFamily} className="size-6" />
          Avisar familiares autorizados a ver minha glicemia
        </label>
      </fieldset>
      {state.error && <p role="alert" className="text-base font-medium text-destructive">{state.error}</p>}
      {state.ok && <p role="status" className="text-base font-medium">Perfil salvo.</p>}
      <Button type="submit" disabled={pending} className="h-14 text-lg">
        {pending ? "Salvando..." : "Salvar"}
      </Button>
    </form>
  );
}
