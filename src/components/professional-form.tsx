"use client";

import { saveProfessionalProfile, type ProState } from "@/app/(app)/perfil/profissional/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { COUNCILS, UFS } from "@/lib/privacy/professional";
import { useFormAction } from "@/lib/use-form-action";

type Props = { profession: string; council: string; uf: string; registryNumber: string; bio: string };

const select =
  "h-12 w-full rounded-lg border border-input bg-background px-3 text-base focus-visible:outline-2 focus-visible:outline-ring";

export function ProfessionalForm(p: Props) {
  const [state, onSubmit, pending] = useFormAction<ProState>(saveProfessionalProfile, {});
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="profession" className="text-base">Profissão (ex.: médico(a), nutricionista)</Label>
        <Input id="profession" name="profession" defaultValue={p.profession} required maxLength={60} className="h-12 text-base" />
      </div>
      <fieldset className="flex flex-col gap-3 rounded-2xl border p-4">
        <legend className="px-1 text-lg font-medium">Registro profissional (para verificação)</legend>
        <div className="flex flex-col gap-2">
          <Label htmlFor="registryCouncil" className="text-base">Conselho</Label>
          <select id="registryCouncil" name="registryCouncil" defaultValue={p.council} className={select}>
            <option value="">Não informar</option>
            {COUNCILS.map((c) => (
              <option key={c.key} value={c.key}>{c.label}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-1 flex flex-col gap-2">
            <Label htmlFor="registryUf" className="text-base">UF</Label>
            <select id="registryUf" name="registryUf" defaultValue={p.uf} className={select}>
              <option value="">—</option>
              {UFS.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
          <div className="col-span-2 flex flex-col gap-2">
            <Label htmlFor="registryNumber" className="text-base">Número</Label>
            <Input id="registryNumber" name="registryNumber" defaultValue={p.registryNumber} maxLength={15} className="h-12 text-base" />
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Um administrador confere conselho, UF, número e nome no portal oficial do conselho. Alterar o registro reinicia a conferência.
        </p>
      </fieldset>
      <div className="flex flex-col gap-2">
        <Label htmlFor="bio" className="text-base">Descrição — opcional</Label>
        <textarea
          id="bio"
          name="bio"
          defaultValue={p.bio}
          maxLength={500}
          rows={4}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-base focus-visible:outline-2 focus-visible:outline-ring"
        />
      </div>
      {state.error && <p role="alert" className="text-base font-medium text-destructive">{state.error}</p>}
      {state.ok && <p role="status" className="text-base font-medium">Perfil profissional salvo.</p>}
      <Button type="submit" disabled={pending} className="h-14 text-lg">{pending ? "Salvando..." : "Salvar"}</Button>
    </form>
  );
}
