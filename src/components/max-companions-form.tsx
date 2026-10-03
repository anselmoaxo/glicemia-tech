"use client";

import { updateMaxCompanions, type SettingsState } from "@/app/admin/configuracoes/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFormAction } from "@/lib/use-form-action";

export function MaxCompanionsForm({ current, ceiling }: { current: number; ceiling: number }) {
  const [state, action, pending] = useFormAction<SettingsState>(updateMaxCompanions, {});
  return (
    <form onSubmit={action} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex flex-col gap-2">
        <Label htmlFor="maxCompanions" className="text-base">Limite (1 a {ceiling})</Label>
        <Input id="maxCompanions" name="maxCompanions" type="number" min={1} max={ceiling} defaultValue={current} required className="h-12 w-32 text-base" />
      </div>
      <Button type="submit" disabled={pending} className="h-12 text-base">{pending ? "Salvando..." : "Salvar"}</Button>
      {state.error && <p role="alert" className="text-base font-medium text-destructive">{state.error}</p>}
      {state.ok && <p role="status" className="text-base font-medium">Limite salvo.</p>}
    </form>
  );
}
