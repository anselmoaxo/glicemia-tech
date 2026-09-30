export const SHARE_MODULES = [
  { key: "glucose", label: "Glicemia" },
  { key: "meals", label: "Alimentação" },
  { key: "medications", label: "Medicamentos" },
  { key: "insulin", label: "Insulina" },
  { key: "reports", label: "Relatórios" },
] as const;

export type ShareModule = (typeof SHARE_MODULES)[number]["key"];

export const SHARE_MODULE_KEYS = SHARE_MODULES.map((m) => m.key) as [ShareModule, ...ShareModule[]];

export const moduleLabel = (key: string) => SHARE_MODULES.find((m) => m.key === key)?.label ?? key;
