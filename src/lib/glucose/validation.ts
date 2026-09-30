import { z } from "zod";
import { CONTEXT_KEYS, CUSTOM_CONTEXT_KEY } from "./contexts";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Máximo de ${max} caracteres`)
    .transform((v) => v || null);

export const readingSchema = z
  .object({
    value: z.coerce
      .number()
      .int("Use um número inteiro")
      .min(20, "Valor muito baixo")
      .max(600, "Valor muito alto"),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
    time: z.string().regex(/^\d{2}:\d{2}$/, "Hora inválida"),
    contextKey: z.enum([...CONTEXT_KEYS, CUSTOM_CONTEXT_KEY], { message: "Escolha o contexto" }),
    customContext: z.string().trim().max(40, "Máximo de 40 caracteres"),
    notes: optionalText(500),
    symptoms: optionalText(200),
    activity: optionalText(200),
  })
  .refine((v) => v.contextKey !== CUSTOM_CONTEXT_KEY || v.customContext.length > 0, {
    path: ["customContext"],
    message: "Informe o nome do contexto",
  });

const mg = z.union([z.literal(""), z.coerce.number().int().min(20).max(600)]);

export const targetsSchema = z.object({
  geral_min: mg,
  geral_max: mg,
  jejum_min: mg,
  jejum_max: mg,
  pos_refeicao_min: mg,
  pos_refeicao_max: mg,
});

export const uuidSchema = z.string().uuid();
