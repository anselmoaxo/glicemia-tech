export const MEAL_RELATIONS = [
  { key: "antes_refeicao", label: "Antes da refeição" },
  { key: "com_refeicao", label: "Junto com a refeição" },
  { key: "apos_refeicao", label: "Após a refeição" },
  { key: "sem_relacao", label: "Sem relação com refeição" },
] as const;

export const SITES = [
  { key: "abdomen", label: "Abdômen" },
  { key: "coxa", label: "Coxa" },
  { key: "braco", label: "Braço" },
  { key: "gluteo", label: "Glúteo" },
  { key: "outro", label: "Outro" },
] as const;

export const NEW_TYPE = "novo";

export const MEAL_RELATION_KEYS = MEAL_RELATIONS.map((m) => m.key) as [
  (typeof MEAL_RELATIONS)[number]["key"],
  ...(typeof MEAL_RELATIONS)[number]["key"][],
];
export const SITE_KEYS = SITES.map((s) => s.key) as [
  (typeof SITES)[number]["key"],
  ...(typeof SITES)[number]["key"][],
];

export const relationLabel = (key: string) => MEAL_RELATIONS.find((m) => m.key === key)?.label ?? key;
export const siteLabel = (key: string | null) => SITES.find((s) => s.key === key)?.label ?? null;

/** Exibe unidades sem zeros desnecessários: "10.0" -> "10", "4.5" -> "4,5". */
export const formatUnits = (units: string | number) => String(Number(units)).replace(".", ",");
