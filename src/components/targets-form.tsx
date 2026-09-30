"use client";

import { useActionState } from "react";
import { saveTargets, type TargetsState } from "@/app/(app)/metas/actions";
import type { Targets } from "@/lib/glucose/classify";
import { TARGET_KEYS } from "@/lib/glucose/contexts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function TargetsForm({ targets }: { targets: Targets }) {
  const [state, action, pending] = useActionState<TargetsState, FormData>(saveTargets, {});
  return (
    <form action={action} className="flex flex-col gap-6">
      {TARGET_KEYS.map(({ key, label }) => (
        <fieldset key={key} className="flex flex-col gap-3 rounded-2xl border bg-card p-4">
          <legend className="px-1 text-lg font-semibold">{label}</legend>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor={`${key}_min`} className="text-base">Mínimo</Label>
              <Input
                id={`${key}_min`}
                name={`${key}_min`}
                type="number"
                inputMode="numeric"
                min={20}
                max={600}
                defaultValue={targets[key]?.min ?? ""}
                className="h-12 text-base"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor={`${key}_max`} className="text-base">Máximo</Label>
              <Input
                id={`${key}_max`}
                name={`${key}_max`}
                type="number"
                inputMode="numeric"
                min={20}
                max={600}
                defaultValue={targets[key]?.max ?? ""}
                className="h-12 text-base"
              />
            </div>
          </div>
        </fieldset>
      ))}
      {state.error && <p role="alert" className="text-base font-medium text-destructive">{state.error}</p>}
      {state.ok && <p role="status" className="text-base font-medium">Metas salvas.</p>}
      <Button type="submit" disabled={pending} className="h-14 text-lg">
        {pending ? "Salvando..." : "Salvar metas"}
      </Button>
    </form>
  );
}
