import { z } from "zod";
import { MEAL_RELATION_KEYS, NEW_TYPE, SITE_KEYS } from "./options";

export const insulinSchema = z
  .object({
    units: z.coerce
      .number()
      .min(0.5, "Informe as unidades")
      .max(300, "Valor muito alto")
      .refine((v) => Number.isInteger(v * 2), "Use múltiplos de 0,5"),
    typeId: z.string().min(1, "Escolha o tipo de insulina"),
    newType: z.string().trim().max(40, "Máximo de 40 caracteres"),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
    time: z.string().regex(/^\d{2}:\d{2}$/, "Hora inválida"),
    mealRelation: z.enum(MEAL_RELATION_KEYS, { message: "Escolha a relação com a refeição" }),
    site: z
      .union([z.enum(SITE_KEYS), z.literal("")])
      .transform((v) => v || null),
    notes: z
      .string()
      .trim()
      .max(300, "Máximo de 300 caracteres")
      .transform((v) => v || null),
  })
  .superRefine((v, ctx) => {
    if (v.typeId === NEW_TYPE) {
      if (!v.newType) ctx.addIssue({ code: "custom", path: ["newType"], message: "Informe o nome do tipo" });
    } else if (!z.string().uuid().safeParse(v.typeId).success) {
      ctx.addIssue({ code: "custom", path: ["typeId"], message: "Tipo inválido" });
    }
  });
