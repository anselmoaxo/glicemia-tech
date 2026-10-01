"use client";

import { useEffect } from "react";
import { clearRange, saveRange, type RangeState } from "@/app/(app)/alertas/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { validateRange, type RangeSettings } from "@/lib/alerts/range";
import { useFormAction } from "@/lib/use-form-action";

export function RangeAlertForm({ settings }: { settings: RangeSettings }) {
  // valida no navegador e de novo no servidor
  const [state, onSubmit, pending] = useFormAction<RangeState>(async (prev, formData) => {
    const local = validateRange(Object.fromEntries(formData));
    if (!local.values) return { errors: local.errors };
    return saveRange(prev, formData);
  }, {});
  const errors = state.errors ?? {};
  const saved = `${settings.enabled}-${settings.low ?? ""}-${settings.high ?? ""}`;
  const hasValues = settings.low !== null || settings.high !== null;

  // leva o foco ao campo com problema (teclado e leitor de tela)
  useEffect(() => {
    if (errors.low) document.getElementById("low")?.focus();
    else if (errors.high) document.getElementById("high")?.focus();
    else if (errors.form) document.getElementById("low")?.focus();
  }, [errors.low, errors.high, errors.form, state]);

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <div key={saved} className="flex flex-col gap-5">
        <label className="flex items-start gap-3 text-lg">
          <input type="checkbox" name="enabled" defaultChecked={settings.enabled} className="mt-1 size-6 shrink-0" />
          <span>
            <strong>Avisar quando a medição ficar fora da minha faixa</strong>
            <span className="block text-base text-muted-foreground">
              O aviso aparece na tela logo depois de você salvar uma medição.
            </span>
          </span>
        </label>

        <div className="grid grid-cols-2 gap-3 md:max-w-md">
          {(["low", "high"] as const).map((k) => (
            <div key={k} className="flex min-w-0 flex-col gap-2">
              <Label htmlFor={k} className="text-base">
                Limite {k === "low" ? "inferior" : "superior"}{" "}
                <span className="font-normal text-muted-foreground">(mg/dL)</span>
              </Label>
              <Input
                id={k}
                name={k}
                type="text"
                inputMode="numeric"
                autoComplete="off"
                maxLength={3}
                defaultValue={(k === "low" ? settings.low : settings.high) ?? ""}
                aria-invalid={errors[k] || errors.form ? true : undefined}
                aria-describedby={errors[k] ? `${k}-error` : errors.form ? "range-form-error" : undefined}
                className="h-14 text-center text-2xl font-bold"
              />
              {errors[k] && (
                <p id={`${k}-error`} role="alert" className="text-base font-medium text-destructive">
                  {errors[k]}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {errors.form && (
        <p id="range-form-error" role="alert" className="text-base font-medium text-destructive">
          {errors.form}
        </p>
      )}
      {state.ok && (
        <p role="status" className="text-base font-semibold text-ok">
          Configuração salva.
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button type="submit" disabled={pending} className="h-14 px-6 text-lg">
          {pending ? "Salvando..." : "Salvar faixa"}
        </Button>
        {hasValues && (
          <button
            type="button"
            onClick={async () => {
              if (confirm("Remover a faixa e desligar o aviso?")) await clearRange();
            }}
            className="flex min-h-14 items-center justify-center rounded-lg border-2 border-destructive px-6 text-base font-medium text-destructive focus-visible:outline-2 focus-visible:outline-ring"
          >
            Remover faixa
          </button>
        )}
      </div>
    </form>
  );
}
