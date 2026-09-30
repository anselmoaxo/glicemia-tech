export const CONTEXTS = [
  { key: "jejum", label: "Jejum" },
  { key: "antes_refeicao", label: "Antes da refeição" },
  { key: "apos_1h", label: "1h após refeição" },
  { key: "apos_2h", label: "2h após refeição" },
  { key: "antes_dormir", label: "Antes de dormir" },
  { key: "aleatoria", label: "Aleatória" },
] as const;

export const CUSTOM_CONTEXT_KEY = "personalizado";

export type ContextKey = (typeof CONTEXTS)[number]["key"];

export const CONTEXT_KEYS = CONTEXTS.map((c) => c.key) as [ContextKey, ...ContextKey[]];

const LABELS: Record<string, string> = Object.fromEntries(CONTEXTS.map((c) => [c.key, c.label]));

export function contextLabel(key: string | null, customLabel?: string | null) {
  if (key === CUSTOM_CONTEXT_KEY || !key) return customLabel ?? "Personalizado";
  return LABELS[key] ?? key;
}

// Faixas configuráveis: a geral vale para qualquer contexto sem faixa própria.
export const TARGET_KEYS = [
  { key: "geral", label: "Geral (todos os contextos)" },
  { key: "jejum", label: "Jejum" },
  { key: "pos_refeicao", label: "Pós-refeição (1h e 2h)" },
] as const;

export type TargetKey = (typeof TARGET_KEYS)[number]["key"];

export function targetKeyFor(contextKey: string): TargetKey {
  if (contextKey === "jejum") return "jejum";
  if (contextKey === "apos_1h" || contextKey === "apos_2h") return "pos_refeicao";
  return "geral";
}
