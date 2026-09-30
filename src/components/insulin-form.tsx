"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import type { InsulinState } from "@/app/(app)/insulina/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MEAL_RELATIONS, NEW_TYPE, SITES } from "@/lib/insulin/options";

export type InsulinDefaults = {
  units: string;
  typeId: string;
  newType: string;
  date: string;
  time: string;
  mealRelation: string;
  site: string;
  notes: string;
};

type Props = {
  action: (state: InsulinState, formData: FormData) => Promise<InsulinState>;
  types: { id: string; name: string }[];
  defaults: InsulinDefaults;
  submitLabel: string;
};

const chip =
  "flex min-h-14 cursor-pointer items-center justify-center rounded-lg border-2 border-input px-3 text-center text-base font-medium peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring";

const field =
  "h-12 w-full rounded-lg border border-input bg-background px-3 text-base focus-visible:outline-2 focus-visible:outline-ring";

export function InsulinForm({ action, types, defaults: d, submitLabel }: Props) {
  const [state, formAction, pending] = useActionState<InsulinState, FormData>(action, {});
  const [typeId, setTypeId] = useState(d.typeId || (types.length === 0 ? NEW_TYPE : ""));
  const options = [...types.map((t) => ({ key: t.id, label: t.name })), { key: NEW_TYPE, label: "+ Novo tipo" }];

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Label htmlFor="units" className="text-lg">Unidades aplicadas</Label>
        <Input
          id="units"
          name="units"
          type="number"
          inputMode="decimal"
          min={0.5}
          max={300}
          step={0.5}
          defaultValue={d.units}
          autoFocus
          required
          className="h-20 text-center text-4xl font-bold"
        />
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-lg font-medium">Tipo de insulina</legend>
        <div className="grid grid-cols-2 gap-3">
          {options.map((o) => (
            <label key={o.key} className="relative">
              <input
                type="radio"
                name="typeId"
                value={o.key}
                checked={typeId === o.key}
                onChange={() => setTypeId(o.key)}
                required
                className="peer sr-only"
              />
              <span className={chip}>{o.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {typeId === NEW_TYPE ? (
        <div className="flex flex-col gap-2">
          <Label htmlFor="newType" className="text-base">Nome do tipo (ex.: NPH, Regular)</Label>
          <Input id="newType" name="newType" maxLength={40} defaultValue={d.newType} required className="h-12 text-base" />
        </div>
      ) : (
        <input type="hidden" name="newType" value="" />
      )}

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-lg font-medium">Relação com a refeição</legend>
        <div className="grid grid-cols-2 gap-3">
          {MEAL_RELATIONS.map((m) => (
            <label key={m.key} className="relative">
              <input
                type="radio"
                name="mealRelation"
                value={m.key}
                defaultChecked={d.mealRelation === m.key}
                required
                className="peer sr-only"
              />
              <span className={chip}>{m.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="date" className="text-base">Data</Label>
          <Input id="date" name="date" type="date" defaultValue={d.date} required className="h-12 text-base" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="time" className="text-base">Hora</Label>
          <Input id="time" name="time" type="time" defaultValue={d.time} required className="h-12 text-base" />
        </div>
      </div>

      <details className="rounded-lg border px-4 py-3" open={!!(d.site || d.notes)}>
        <summary className="min-h-10 cursor-pointer text-base font-medium">Mais detalhes (opcional)</summary>
        <div className="mt-3 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="site" className="text-base">Local da aplicação</Label>
            <select id="site" name="site" defaultValue={d.site} className={field}>
              <option value="">Não informar</option>
              {SITES.map((s) => (
                <option key={s.key} value={s.key}>{s.label}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="notes" className="text-base">Observação</Label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              maxLength={300}
              defaultValue={d.notes}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-base focus-visible:outline-2 focus-visible:outline-ring"
            />
          </div>
        </div>
      </details>

      {state.error && <p role="alert" className="text-base font-medium text-destructive">{state.error}</p>}

      <p className="text-sm text-muted-foreground">
        Registre apenas o que foi aplicado conforme sua orientação médica. O app não sugere doses.
      </p>

      <div className="flex flex-col gap-3">
        <Button type="submit" disabled={pending} className="h-14 text-lg">
          {pending ? "Salvando..." : submitLabel}
        </Button>
        <Link href="/insulina" className="flex min-h-12 items-center justify-center text-base underline underline-offset-4">
          Cancelar
        </Link>
      </div>
    </form>
  );
}
