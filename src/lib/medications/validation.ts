import { z } from "zod";
import { UNITS } from "./schedule";

const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Horário inválido");

export const medicationSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome").max(80, "Nome muito longo"),
  dose: z.string().trim().min(1, "Informe a dose").max(20, "Dose muito longa"),
  unit: z.enum(UNITS, { message: "Escolha a unidade" }),
  times: z
    .array(timeSchema)
    .min(1, "Informe ao menos um horário")
    .max(6, "No máximo 6 horários")
    .refine((t) => new Set(t).size === t.length, "Horários repetidos"),
  days: z
    .array(z.coerce.number().int().min(0).max(6))
    .min(1, "Escolha ao menos um dia da semana")
    .transform((d) => [...new Set(d)].sort()),
  notes: z
    .string()
    .trim()
    .max(300, "Máximo de 300 caracteres")
    .transform((v) => v || null),
});

export const doseLogSchema = z.object({
  scheduleId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: z.enum(["taken", "skipped"]),
});

/** Converte FormData em objeto, agrupando campos repetidos (times, days). */
export function medicationFormToObject(fd: FormData) {
  return {
    name: fd.get("name"),
    dose: fd.get("dose"),
    unit: fd.get("unit"),
    notes: fd.get("notes") ?? "",
    times: fd.getAll("times").filter((t) => t !== ""),
    days: fd.getAll("days"),
  };
}
