"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import type { MealState } from "@/app/(app)/refeicoes/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MEAL_TYPES } from "@/lib/meals/types";

export type MealDefaults = {
  mealType: string;
  customType: string;
  date: string;
  time: string;
  description: string;
};

type Props = {
  action: (state: MealState, formData: FormData) => Promise<MealState>;
  defaults: MealDefaults;
  submitLabel: string;
};

const chip =
  "flex min-h-14 cursor-pointer items-center justify-center rounded-lg border-2 border-input px-3 text-center text-base font-medium peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring";

export function MealForm({ action, defaults: d, submitLabel }: Props) {
  const [state, formAction, pending] = useActionState<MealState, FormData>(action, {});
  const [type, setType] = useState(d.mealType);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-lg font-medium">Tipo de refeição</legend>
        <div className="grid grid-cols-2 gap-3">
          {MEAL_TYPES.map((m) => (
            <label key={m.key} className="relative">
              <input
                type="radio"
                name="mealType"
                value={m.key}
                checked={type === m.key}
                onChange={() => setType(m.key)}
                required
                className="peer sr-only"
              />
              <span className={chip}>{m.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {type === "personalizado" ? (
        <div className="flex flex-col gap-2">
          <Label htmlFor="customType" className="text-base">Nome da refeição</Label>
          <Input id="customType" name="customType" maxLength={40} defaultValue={d.customType} required className="h-12 text-base" />
        </div>
      ) : (
        <input type="hidden" name="customType" value="" />
      )}

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

      <div className="flex flex-col gap-2">
        <Label htmlFor="description" className="text-base">O que você comeu?</Label>
        <textarea
          id="description"
          name="description"
          rows={4}
          maxLength={500}
          defaultValue={d.description}
          required
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-base focus-visible:outline-2 focus-visible:outline-ring"
        />
      </div>

      {state.error && <p role="alert" className="text-base font-medium text-destructive">{state.error}</p>}

      <div className="flex flex-col gap-3">
        <Button type="submit" disabled={pending} className="h-14 text-lg">
          {pending ? "Salvando..." : submitLabel}
        </Button>
        <Link href="/refeicoes" className="flex min-h-12 items-center justify-center text-base underline underline-offset-4">
          Cancelar
        </Link>
      </div>
    </form>
  );
}
