"use client";

import Link from "next/link";
import { useFormAction } from "@/lib/use-form-action";
import { useState } from "react";
import type { MedicationState } from "@/app/(app)/medicamentos/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UNITS, WEEKDAYS } from "@/lib/medications/schedule";

export type MedicationDefaults = {
  name: string;
  dose: string;
  unit: string;
  notes: string;
  times: string[];
  days: number[];
};

type Props = {
  action: (state: MedicationState, formData: FormData) => Promise<MedicationState>;
  defaults: MedicationDefaults;
  submitLabel: string;
};

const chip =
  "flex min-h-12 min-w-14 cursor-pointer items-center justify-center rounded-lg border-2 border-input px-3 text-base font-medium peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring";

const field =
  "h-12 w-full rounded-lg border border-input bg-background px-3 text-base focus-visible:outline-2 focus-visible:outline-ring";

export function MedicationForm({ action, defaults: d, submitLabel }: Props) {
  const [state, formAction, pending] = useFormAction<MedicationState>(action, {});
  const [times, setTimes] = useState(d.times.length ? d.times : [""]);

  return (
    <form onSubmit={formAction} className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name" className="text-base">Nome do medicamento</Label>
        <Input id="name" name="name" maxLength={80} defaultValue={d.name} required className="h-12 text-base" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="dose" className="text-base">Dose</Label>
          <Input id="dose" name="dose" maxLength={20} defaultValue={d.dose} required className="h-12 text-base" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="unit" className="text-base">Unidade</Label>
          <select id="unit" name="unit" defaultValue={d.unit || "mg"} className={field}>
            {UNITS.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </div>
      </div>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 text-lg font-medium">Horários</legend>
        {times.map((t, i) => (
          <div key={i} className="flex items-center gap-3">
            <Input
              type="time"
              name="times"
              aria-label={`Horário ${i + 1}`}
              value={t}
              onChange={(e) => setTimes(times.map((v, j) => (j === i ? e.target.value : v)))}
              required
              className="h-12 flex-1 text-base"
            />
            {times.length > 1 && (
              <button
                type="button"
                onClick={() => setTimes(times.filter((_, j) => j !== i))}
                className="min-h-12 rounded-lg border-2 px-4 text-base focus-visible:outline-2 focus-visible:outline-ring"
              >
                Remover
              </button>
            )}
          </div>
        ))}
        {times.length < 6 && (
          <button
            type="button"
            onClick={() => setTimes([...times, ""])}
            className="min-h-12 rounded-lg border-2 border-dashed text-base font-medium focus-visible:outline-2 focus-visible:outline-ring"
          >
            + Adicionar horário
          </button>
        )}
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-lg font-medium">Dias da semana</legend>
        <div className="flex flex-wrap gap-2">
          {WEEKDAYS.map((w) => (
            <label key={w.value} className="relative">
              <input
                type="checkbox"
                name="days"
                value={w.value}
                defaultChecked={d.days.includes(w.value)}
                className="peer sr-only"
              />
              <span className={chip}>{w.short}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-col gap-2">
        <Label htmlFor="notes" className="text-base">Observação (opcional)</Label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          maxLength={300}
          defaultValue={d.notes}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-base focus-visible:outline-2 focus-visible:outline-ring"
        />
      </div>

      {state.error && <p role="alert" className="text-base font-medium text-destructive">{state.error}</p>}

      <div className="flex flex-col gap-3">
        <Button type="submit" disabled={pending} className="h-14 text-lg">
          {pending ? "Salvando..." : submitLabel}
        </Button>
        <Link href="/medicamentos" className="flex min-h-12 items-center justify-center text-base underline underline-offset-4">
          Cancelar
        </Link>
      </div>
    </form>
  );
}
