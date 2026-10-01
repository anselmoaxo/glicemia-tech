import { dateToLocalInputs } from "@/lib/datetime";

export const DAYS = [
  { bit: 1, short: "Dom", label: "Domingo" },
  { bit: 2, short: "Seg", label: "Segunda-feira" },
  { bit: 4, short: "Ter", label: "Terça-feira" },
  { bit: 8, short: "Qua", label: "Quarta-feira" },
  { bit: 16, short: "Qui", label: "Quinta-feira" },
  { bit: 32, short: "Sex", label: "Sexta-feira" },
  { bit: 64, short: "Sáb", label: "Sábado" },
] as const;

export const ALL_DAYS = 127;
export const MAX_REMINDERS = 10;
/** Janela depois do horário em que o lembrete ainda é enviado (tolera a frequência do agendador). */
export const SEND_WINDOW_MIN = 120;

export const TIMEZONES = [
  { value: "America/Sao_Paulo", label: "Brasília (SP, RJ, MG, sul e nordeste)" },
  { value: "America/Manaus", label: "Amazonas (Manaus)" },
  { value: "America/Cuiaba", label: "Mato Grosso (Cuiabá)" },
  { value: "America/Campo_Grande", label: "Mato Grosso do Sul" },
  { value: "America/Rio_Branco", label: "Acre (Rio Branco)" },
  { value: "America/Noronha", label: "Fernando de Noronha" },
] as const;

const TZ = new Set<string>(TIMEZONES.map((t) => t.value));

export type ReminderInput = { time: string; daysMask: number; timezone: string };
export type ReminderValidation = { values?: ReminderInput; error?: string };

/** Lê `time`, `day` (várias) e `timezone` do formulário. */
export function validateReminder(form: FormData, fallbackTz = "America/Sao_Paulo"): ReminderValidation {
  const time = String(form.get("time") ?? "").trim();
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return { error: "Escolha um horário válido." };

  let daysMask = 0;
  for (const v of form.getAll("day")) {
    const bit = DAYS.find((d) => String(d.bit) === v)?.bit;
    if (bit) daysMask |= bit;
  }
  if (daysMask === 0) return { error: "Escolha pelo menos um dia da semana." };

  const tz = String(form.get("timezone") ?? fallbackTz);
  if (!TZ.has(tz)) return { error: "Escolha um fuso horário da lista." };
  return { values: { time, daysMask, timezone: tz } };
}

export function daysSummary(mask: number): string {
  if (mask === ALL_DAYS) return "Todos os dias";
  if (mask === 0b0111110) return "Segunda a sexta";
  if (mask === 0b1000001) return "Sábado e domingo";
  return DAYS.filter((d) => mask & d.bit).map((d) => d.short).join(", ");
}

type DueInput = { timeLocal: string; daysMask: number; timezone: string; enabled: boolean; lastSentOn: string | null };

/** O lembrete deve ser enviado agora? (no fuso dele, dia marcado, já passou o horário, ainda dentro da janela, não enviado hoje) */
export function isDue(r: DueInput, now: Date): boolean {
  if (!r.enabled) return false;
  const local = dateToLocalInputs(now, r.timezone);
  const [y, m, d] = local.date.split("-").map(Number);
  const weekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  if (!(r.daysMask & (1 << weekday))) return false;
  if (r.lastSentOn === local.date) return false;
  const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
  const diff = toMin(local.time) - toMin(r.timeLocal);
  return diff >= 0 && diff < SEND_WINDOW_MIN;
}
