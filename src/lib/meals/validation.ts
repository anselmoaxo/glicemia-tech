import { z } from "zod";
import { MEAL_TYPE_KEYS } from "./types";

export const mealSchema = z
  .object({
    mealType: z.enum(MEAL_TYPE_KEYS, { message: "Escolha o tipo de refeição" }),
    customType: z.string().trim().max(40, "Máximo de 40 caracteres"),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
    time: z.string().regex(/^\d{2}:\d{2}$/, "Hora inválida"),
    description: z
      .string()
      .trim()
      .min(1, "Descreva o que comeu")
      .max(500, "Máximo de 500 caracteres"),
  })
  .refine((v) => v.mealType !== "personalizado" || v.customType.length > 0, {
    path: ["customType"],
    message: "Informe o nome da refeição",
  });
