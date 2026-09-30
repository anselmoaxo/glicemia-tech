import { targetKeyFor, type TargetKey } from "./contexts";

export type Targets = Partial<Record<TargetKey, { min: number; max: number }>>;
export type GlucoseStatus = "low" | "high" | "in_range" | "no_target";

/** Compara com as faixas definidas pelo próprio usuário; não interpreta clinicamente. */
export function classify(value: number, contextKey: string, targets: Targets): GlucoseStatus {
  const t = targets[targetKeyFor(contextKey)] ?? targets.geral;
  if (!t) return "no_target";
  if (value < t.min) return "low";
  if (value > t.max) return "high";
  return "in_range";
}

export const STATUS_LABEL: Record<GlucoseStatus, string> = {
  low: "Abaixo da faixa",
  high: "Acima da faixa",
  in_range: "Na faixa",
  no_target: "Sem faixa definida",
};

export const OUT_OF_RANGE_MESSAGE =
  "Este valor está fora da faixa configurada por você. Consulte seu plano de cuidados ou profissional de saúde se necessário.";
