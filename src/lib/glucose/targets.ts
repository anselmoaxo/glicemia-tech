import { TARGET_KEYS, type TargetKey } from "./contexts";

export const MG_MIN = 20;
export const MG_MAX = 600;

export type TargetRange = { min: number; max: number };

export type TargetsValidation = {
  /** faixas completas e válidas, prontas para salvar */
  values: Partial<Record<TargetKey, TargetRange>>;
  /** faixas deixadas totalmente em branco: devem ser removidas */
  clear: TargetKey[];
  /** mensagem por faixa com problema */
  errors: Partial<Record<TargetKey, string>>;
};

const INT = /^\d+$/;

/**
 * Valida os campos `${faixa}_min` e `${faixa}_max` (texto do formulário).
 * Mesma regra no navegador (resposta imediata) e no servidor (autoridade).
 * Não impõe valores: só confere que são números inteiros coerentes.
 */
export function validateTargets(raw: Record<string, unknown>): TargetsValidation {
  const out: TargetsValidation = { values: {}, clear: [], errors: {} };
  const text = (k: string) => (typeof raw[k] === "string" ? (raw[k] as string).trim() : "");

  for (const { key } of TARGET_KEYS) {
    const min = text(`${key}_min`);
    const max = text(`${key}_max`);

    if (min === "" && max === "") {
      out.clear.push(key);
    } else if (min === "" || max === "") {
      out.errors[key] = "Preencha o mínimo e o máximo, ou deixe os dois em branco.";
    } else if (!INT.test(min) || !INT.test(max)) {
      out.errors[key] = "Use apenas números inteiros, sem vírgula nem ponto.";
    } else if (+min < MG_MIN || +min > MG_MAX || +max < MG_MIN || +max > MG_MAX) {
      out.errors[key] = `Use valores entre ${MG_MIN} e ${MG_MAX} mg/dL.`;
    } else if (+min >= +max) {
      out.errors[key] = "O mínimo precisa ser menor que o máximo.";
    } else {
      out.values[key] = { min: +min, max: +max };
    }
  }
  return out;
}

/** Primeira faixa com erro, na ordem da tela (para focar o campo certo). */
export function firstErrorKey(errors: TargetsValidation["errors"]): TargetKey | null {
  return TARGET_KEYS.find((t) => errors[t.key])?.key ?? null;
}
