import { z } from "zod";

export const signUpSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome").max(80),
  email: z.string().trim().toLowerCase().email("E-mail inválido"),
  password: z.string().min(8, "A senha deve ter ao menos 8 caracteres").max(128),
});

export const signInSchema = signUpSchema.pick({ email: true }).extend({
  password: z.string().min(1, "Informe a senha"),
});

export const DIABETES_TYPES = ["tipo1", "tipo2", "gestacional", "outro", "nao_informado"] as const;

export const profileSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome").max(80),
  birthDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida")
    .refine((d) => d <= new Date().toISOString().slice(0, 10), "Data no futuro")
    .or(z.literal(""))
    .transform((v) => v || null),
  diabetesType: z.enum(DIABETES_TYPES),
  fontScale: z.coerce.number().int().min(100).max(150),
  alertEmailSelf: z.string().optional().transform((v) => v === "on"),
  alertEmailFamily: z.string().optional().transform((v) => v === "on"),
});
