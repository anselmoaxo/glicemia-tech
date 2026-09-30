import { z } from "zod";
import { MAX_YEARS_WITH_DIABETES } from "./profile-utils";

export const signUpSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome").max(80),
  email: z.string().trim().toLowerCase().email("E-mail inválido"),
  password: z.string().min(8, "A senha deve ter ao menos 8 caracteres").max(128),
});

export const signInSchema = signUpSchema.pick({ email: true }).extend({
  password: z.string().min(1, "Informe a senha"),
});

export const DIABETES_TYPES = ["tipo1", "tipo2", "gestacional", "outro", "nao_informado"] as const;
export const SEXES = ["feminino", "masculino", "nao_informado"] as const;

// Dados de saúde do perfil: todos opcionais (minimização de dados, LGPD).
const birthDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Data de nascimento inválida")
  .refine((d) => d <= new Date().toISOString().slice(0, 10), "A data de nascimento não pode estar no futuro")
  .refine((d) => d >= "1900-01-01", "Data de nascimento inválida")
  .or(z.literal(""))
  .optional()
  .transform((v) => v || null);

const yearsWithDiabetes = z
  .union([
    z.literal(""),
    z.coerce
      .number({ message: "Informe os anos com um número" })
      .int("Use um número inteiro de anos")
      .min(0, "Use zero ou mais anos")
      .max(MAX_YEARS_WITH_DIABETES, "Valor de anos muito alto"),
  ])
  .optional()
  .transform((v) => (v === "" || v === undefined ? null : v));

export const healthFieldsSchema = z.object({
  birthDate,
  sex: z.enum(SEXES).default("nao_informado"),
  diabetesType: z.enum(DIABETES_TYPES).default("nao_informado"),
  yearsWithDiabetes,
});

/** Campos extras do cadastro (vêm depois de nome, e-mail e senha). */
export const signUpExtrasSchema = healthFieldsSchema;

export const profileSchema = healthFieldsSchema.extend({
  name: z.string().trim().min(2, "Informe seu nome").max(80),
  fontScale: z.coerce.number().int().min(100).max(150),
  alertEmailSelf: z.string().optional().transform((v) => v === "on"),
  alertEmailFamily: z.string().optional().transform((v) => v === "on"),
});
