"use client";

import { Info } from "lucide-react";
import Link from "next/link";
import { useFormAction } from "@/lib/use-form-action";
import { useState } from "react";
import type { ReadingState } from "@/app/(app)/glicemia/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RANGE_NOTICE } from "@/lib/alerts/range";
import { CONTEXTS, CUSTOM_CONTEXT_KEY } from "@/lib/glucose/contexts";

export type ReadingDefaults = {
  value: string;
  date: string;
  time: string;
  contextKey: string;
  customContext: string;
  notes: string;
  symptoms: string;
  activity: string;
};

type Props = {
  action: (state: ReadingState, formData: FormData) => Promise<ReadingState>;
  defaults: ReadingDefaults;
  submitLabel: string;
};

const chip =
  "flex min-h-14 cursor-pointer items-center justify-center rounded-lg border-2 border-input px-3 text-center text-base font-medium peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring";

const textarea =
  "w-full rounded-lg border border-input bg-background px-3 py-2 text-base focus-visible:outline-2 focus-visible:outline-ring";

export function GlucoseForm({ action, defaults: d, submitLabel }: Props) {
  const [state, formAction, pending] = useFormAction<ReadingState>(action, {});
  const [context, setContext] = useState(d.contextKey);
  const options = [...CONTEXTS, { key: CUSTOM_CONTEXT_KEY, label: "Outro..." }];

  if (state.outOfRange) {
    return (
      <div className="flex flex-col gap-5">
        <p role="status" className="flex gap-3 rounded-2xl border-2 border-primary bg-secondary p-4 text-lg">
          <Info aria-hidden className="mt-1 size-6 shrink-0 text-primary" />
          <span>
            <strong>Medição salva.</strong> {RANGE_NOTICE}
          </span>
        </p>
        <Link href="/glicemia" className="flex min-h-14 items-center justify-center rounded-lg bg-primary px-5 text-lg font-semibold text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
          Ver meus registros
        </Link>
        <Link href="/alertas" className="flex min-h-12 items-center justify-center text-base underline underline-offset-4">
          Mudar a faixa dos avisos
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={formAction} className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Label htmlFor="value" className="text-lg">Glicemia (mg/dL)</Label>
        <Input
          id="value"
          name="value"
          type="number"
          inputMode="numeric"
          min={20}
          max={600}
          defaultValue={d.value}
          autoFocus
          required
          className="h-20 text-center text-4xl font-bold"
        />
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-lg font-medium">Quando foi medido?</legend>
        <div className="grid grid-cols-2 gap-3">
          {options.map((c) => (
            <label key={c.key} className="relative">
              <input
                type="radio"
                name="contextKey"
                value={c.key}
                checked={context === c.key}
                onChange={() => setContext(c.key)}
                required
                className="peer sr-only"
              />
              <span className={chip}>{c.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {context === CUSTOM_CONTEXT_KEY && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="customContext" className="text-base">Nome do contexto</Label>
          <Input
            id="customContext"
            name="customContext"
            maxLength={40}
            defaultValue={d.customContext}
            required
            className="h-12 text-base"
          />
        </div>
      )}
      {context !== CUSTOM_CONTEXT_KEY && <input type="hidden" name="customContext" value="" />}

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

      <details className="rounded-lg border px-4 py-3" open={!!(d.notes || d.symptoms || d.activity)}>
        <summary className="min-h-10 cursor-pointer text-base font-medium">Mais detalhes (opcional)</summary>
        <div className="mt-3 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="symptoms" className="text-base">Sintomas</Label>
            <Input id="symptoms" name="symptoms" maxLength={200} defaultValue={d.symptoms} className="h-12 text-base" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="activity" className="text-base">Atividade relacionada</Label>
            <Input id="activity" name="activity" maxLength={200} defaultValue={d.activity} className="h-12 text-base" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="notes" className="text-base">Observação</Label>
            <textarea id="notes" name="notes" rows={3} maxLength={500} defaultValue={d.notes} className={textarea} />
          </div>
        </div>
      </details>

      {state.error && <p role="alert" className="text-base font-medium text-destructive">{state.error}</p>}

      <div className="flex flex-col gap-3">
        <Button type="submit" disabled={pending} className="h-14 text-lg">
          {pending ? "Salvando..." : submitLabel}
        </Button>
        <Link href="/glicemia" className="flex min-h-12 items-center justify-center text-base underline underline-offset-4">
          Cancelar
        </Link>
      </div>
    </form>
  );
}
