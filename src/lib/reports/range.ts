import { dateToLocalInputs, localToDate } from "@/lib/datetime";

export const REPORT_PERIODS = [7, 14, 30, 90] as const;
export const MAX_RANGE_DAYS = 366;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function addDaysStr(date: string, n: number) {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export type ReportRange = { fromDate: string; toDate: string; from: Date; to: Date; days: number };

/** Intervalo [from, to) em UTC para datas locais inclusivas fromDate..toDate. */
export function buildRange(fromDate: string, toDate: string, tz: string): ReportRange {
  const days = Math.round((Date.parse(toDate) - Date.parse(fromDate)) / 86_400_000) + 1;
  return {
    fromDate,
    toDate,
    days,
    from: localToDate(fromDate, "00:00", tz),
    to: localToDate(addDaysStr(toDate, 1), "00:00", tz),
  };
}

/**
 * Período por ?dias=7|14|30|90 (padrão 30) ou ?from=&to= (YYYY-MM-DD).
 * Retorna null para intervalos inválidos ou maiores que 366 dias.
 */
export function resolveRange(
  input: { dias?: string | null; from?: string | null; to?: string | null },
  tz: string,
  now = new Date(),
): ReportRange | null {
  const today = dateToLocalInputs(now, tz).date;

  if (input.from && input.to) {
    if (!DATE_RE.test(input.from) || !DATE_RE.test(input.to)) return null;
    const toDate = input.to > today ? today : input.to;
    if (input.from > toDate) return null;
    const range = buildRange(input.from, toDate, tz);
    return range.days <= MAX_RANGE_DAYS ? range : null;
  }

  const n = Number(input.dias ?? 30);
  const days = (REPORT_PERIODS as readonly number[]).includes(n) ? n : 30;
  return buildRange(addDaysStr(today, -(days - 1)), today, tz);
}
