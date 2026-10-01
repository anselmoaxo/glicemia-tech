import { dateToLocalInputs, localToDate } from "@/lib/datetime";

export const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
export const MAX_TIMES = 8;
/** Antes do horário previsto, uma medição já conta como a daquele horário. */
export const EARLY_WINDOW_MIN = 60;
/** Depois deste prazo o horário previsto deixa de ser verificado (evita avisos tardios). */
export const GRACE_MAX_MIN = 360;

export type MeasureSlot = { time: string; at: Date; key: string };

/** Horários previstos do dia local e o instante de cada um. */
export function slotsForDay(date: string, times: string[], tz: string): MeasureSlot[] {
  return [...new Set(times)]
    .filter((t) => TIME_RE.test(t))
    .sort()
    .map((time) => ({ time, at: localToDate(date, time, tz), key: `measure:${date}:${time}` }));
}

/** O dia da semana do dia local está nos dias escolhidos? (bit 1 = domingo). Sem dias escolhidos = todos. */
export function dayEnabled(mask: number | null, date: string): boolean {
  if (!mask) return true;
  const wd = new Date(`${date}T12:00:00Z`).getUTCDay();
  return Boolean(mask & (1 << wd));
}

/**
 * Este horário previsto precisa de aviso agora? Só depois do prazo de tolerância, sem passar do limite máximo
 * e sem nenhuma medição registrada desde (horário − janela antecipada).
 */
export function isMissed(slotAt: Date, toleranceMin: number, now: Date, readingTimes: Date[]): boolean {
  const due = slotAt.getTime() + toleranceMin * 60_000;
  if (now.getTime() < due || now.getTime() > slotAt.getTime() + GRACE_MAX_MIN * 60_000) return false;
  const from = slotAt.getTime() - EARLY_WINDOW_MIN * 60_000;
  return !readingTimes.some((t) => t.getTime() >= from && t.getTime() <= now.getTime());
}

export const localDate = (now: Date, tz: string) => dateToLocalInputs(now, tz).date;
