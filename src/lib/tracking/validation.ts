import { z } from "zod";
import { MAX_TIMES, TIME_RE } from "./slots";

export const TOLERANCE_OPTIONS = [15, 30, 45, 60, 90, 120, 180] as const;

const flag = z.string().optional().transform((v) => v === "on");

export const planSchema = z.object({
  specificEnabled: flag,
  days: z.array(z.coerce.number().int().min(0).max(6)).max(7),
  times: z
    .array(z.string().trim())
    .transform((a) => [...new Set(a.filter(Boolean))])
    .pipe(z.array(z.string().regex(TIME_RE, "Horário inválido")).max(MAX_TIMES, `No máximo ${MAX_TIMES} horários`)),
  expectedPerDay: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : Number(v)))
    .pipe(z.number().int("Use um número inteiro").min(1, "Use de 1 a 24").max(24, "Use de 1 a 24").nullable()),
  toleranceMin: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : Number(v)))
    .pipe(z.number().refine((n) => (TOLERANCE_OPTIONS as readonly number[]).includes(n), "Escolha uma opção da lista").nullable()),
  trackMedication: flag,
  channelApp: flag,
  emailMissedMeasure: flag,
  emailMedUnconfirmed: flag,
  alertEmailSelf: flag,
  notifyFamily: flag,
});

/** Dias da semana (0 = domingo) para a máscara em bits (domingo = 1). Vazio = sem dias escolhidos. */
export const daysToMask = (days: number[]) => days.reduce((m, d) => m | (1 << d), 0) || null;
