import { MG_MAX, MG_MIN } from "@/lib/glucose/targets";

export const RANGE_NOTICE =
  "Essa medição ficou fora da faixa que você configurou. Confira o valor registrado e siga a orientação recebida do seu profissional de saúde.";

export type RangeSettings = { enabled: boolean; low: number | null; high: number | null };

export type RangeValidation = {
  values?: RangeSettings;
  errors: { low?: string; high?: string; form?: string };
};

const INT = /^\d+$/;

/**
 * Valida o formulário da faixa pessoal (`enabled`, `low`, `high`). Não há valores padrão:
 * campos vazios só são aceitos com o aviso desativado.
 */
export function validateRange(raw: Record<string, unknown>): RangeValidation {
  const text = (k: string) => (typeof raw[k] === "string" ? (raw[k] as string).trim() : "");
  const enabled = raw.enabled === "on" || raw.enabled === "true";
  const low = text("low");
  const high = text("high");
  const errors: RangeValidation["errors"] = {};

  const check = (v: string, key: "low" | "high") => {
    if (v === "") return enabled ? (errors[key] = "Preencha este limite para ativar o aviso.") : null;
    if (!INT.test(v)) return (errors[key] = "Use apenas números inteiros, sem vírgula nem ponto.");
    if (+v < MG_MIN || +v > MG_MAX) return (errors[key] = `Use um valor entre ${MG_MIN} e ${MG_MAX} mg/dL.`);
    return null;
  };
  check(low, "low");
  check(high, "high");

  if (!errors.low && !errors.high) {
    if (low === "" !== (high === "")) {
      errors[low === "" ? "low" : "high"] = "Preencha os dois limites, ou deixe os dois em branco.";
    } else if (low !== "" && +low >= +high) {
      errors.form = "O limite inferior precisa ser menor que o superior.";
    }
  }
  if (errors.low || errors.high || errors.form) return { errors };

  return { errors, values: { enabled, low: low === "" ? null : +low, high: high === "" ? null : +high } };
}

/** Verdadeiro só com o recurso ativo, os dois limites definidos e o valor fora deles. */
export function isOutsideRange(value: number, s: RangeSettings | null | undefined): boolean {
  if (!s || !s.enabled || s.low === null || s.high === null) return false;
  return value < s.low || value > s.high;
}
