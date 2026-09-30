"use client";

import { Check } from "lucide-react";
import { useEffect } from "react";
import { saveTargets, type TargetsState } from "@/app/(app)/metas/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Targets } from "@/lib/glucose/classify";
import { TARGET_KEYS, type TargetKey } from "@/lib/glucose/contexts";
import { firstErrorKey, MG_MAX, MG_MIN, validateTargets } from "@/lib/glucose/targets";
import { useFormAction } from "@/lib/use-form-action";

// Texto de apoio de cada faixa: descreve quando ela vale, sem sugerir números.
const HELP: Record<TargetKey, { text: string; example: [string, string] }> = {
  geral: { text: "Vale para toda medição que não tiver uma faixa própria abaixo.", example: ["70", "180"] },
  jejum: { text: "Usada nas medições feitas em jejum.", example: ["70", "100"] },
  pos_refeicao: { text: "Usada nas medições 1h e 2h após a refeição.", example: ["70", "140"] },
};

export function TargetsForm({ targets }: { targets: Targets }) {
  // Valida no navegador (resposta imediata) e só então chama o servidor, que valida de novo.
  const [state, onSubmit, pending] = useFormAction<TargetsState>(async (prev, formData) => {
    const local = validateTargets(Object.fromEntries(formData));
    if (Object.keys(local.errors).length > 0) return { errors: local.errors };
    return saveTargets(prev, formData);
  }, {});

  // Campos recomeçam limpos só quando as metas salvas mudam (não a cada erro).
  const saved = TARGET_KEYS.map(({ key }) => `${targets[key]?.min ?? ""}-${targets[key]?.max ?? ""}`).join("|");
  const errors = state.errors ?? {};
  const firstError = firstErrorKey(errors);

  // Leva o foco ao primeiro campo com erro (teclado e leitor de tela).
  useEffect(() => {
    if (firstError) document.getElementById(`${firstError}_min`)?.focus();
  }, [firstError, state]);

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      <div key={saved} className="grid gap-4 md:grid-cols-2">
        {TARGET_KEYS.map(({ key, label }) => {
          const error = errors[key];
          const help = HELP[key];
          return (
            <fieldset
              key={key}
              aria-describedby={`${key}-help${error ? ` ${key}-error` : ""}`}
              className={`flex min-w-0 flex-col gap-4 rounded-2xl border bg-card p-4 sm:p-5 ${
                key === "geral" ? "md:col-span-2" : ""
              } ${error ? "border-destructive" : ""}`}
            >
              <legend className="px-1 text-xl font-bold">{label}</legend>
              <p id={`${key}-help`} className="-mt-2 text-base text-muted-foreground">{help.text}</p>

              <div className={`mt-auto grid grid-cols-2 gap-3 ${key === "geral" ? "md:max-w-md" : ""}`}>
                {(["min", "max"] as const).map((bound) => (
                  <div key={bound} className="flex min-w-0 flex-col gap-2">
                    <Label htmlFor={`${key}_${bound}`} className="text-base">
                      {bound === "min" ? "Mínimo" : "Máximo"} <span className="font-normal text-muted-foreground">(mg/dL)</span>
                    </Label>
                    <Input
                      id={`${key}_${bound}`}
                      name={`${key}_${bound}`}
                      type="text"
                      inputMode="numeric"
                      autoComplete="off"
                      placeholder={`ex.: ${help.example[bound === "min" ? 0 : 1]}`}
                      maxLength={3}
                      aria-invalid={error ? true : undefined}
                      aria-describedby={error ? `${key}-error` : undefined}
                      defaultValue={targets[key]?.[bound] ?? ""}
                      className="h-14 text-center text-2xl font-semibold placeholder:text-base placeholder:font-normal"
                    />
                  </div>
                ))}
              </div>

              {error && (
                <p id={`${key}-error`} role="alert" className="text-base font-semibold text-destructive">
                  {error}
                </p>
              )}
            </fieldset>
          );
        })}
      </div>

      <p className="text-base text-muted-foreground">
        Valores de {MG_MIN} a {MG_MAX} mg/dL, sem vírgula. Os números em cinza são só exemplos de preenchimento, não uma
        recomendação. Deixe os dois campos em branco para não usar uma faixa.
      </p>

      {state.ok && (
        <p role="status" className="flex items-center gap-2 rounded-xl bg-ok-soft p-4 text-lg font-bold text-ok">
          <Check aria-hidden className="size-6 shrink-0" /> Metas salvas. Elas já valem para as suas medições.
        </p>
      )}

      <Button type="submit" disabled={pending} className="h-14 text-lg md:w-fit md:min-w-64">
        {pending ? "Salvando..." : "Salvar metas"}
      </Button>
    </form>
  );
}
