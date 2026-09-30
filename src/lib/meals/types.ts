export const MEAL_TYPES = [
  { key: "cafe_manha", label: "Café da manhã" },
  { key: "almoco", label: "Almoço" },
  { key: "jantar", label: "Jantar" },
  { key: "lanche", label: "Lanche" },
  { key: "personalizado", label: "Outro..." },
] as const;

export type MealTypeKey = (typeof MEAL_TYPES)[number]["key"];

export const MEAL_TYPE_KEYS = MEAL_TYPES.map((m) => m.key) as [MealTypeKey, ...MealTypeKey[]];

export function mealLabel(key: string, customType: string | null) {
  if (key === "personalizado") return customType ?? "Refeição";
  return MEAL_TYPES.find((m) => m.key === key)?.label ?? key;
}
