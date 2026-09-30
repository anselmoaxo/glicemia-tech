export const PERIODS = [7, 14, 30, 90] as const;
export type Period = (typeof PERIODS)[number];
export const DEFAULT_PERIOD: Period = 7;

/** Interpreta ?periodo= ignorando valores fora da lista permitida. */
export function parsePeriod(raw: unknown): Period {
  const n = Number(Array.isArray(raw) ? raw[0] : raw);
  return (PERIODS as readonly number[]).includes(n) ? (n as Period) : DEFAULT_PERIOD;
}

export function periodStart(days: Period, now = new Date()): Date {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}
