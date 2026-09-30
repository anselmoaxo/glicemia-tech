export type Stats = { count: number; average: number | null; lowest: number | null; highest: number | null };

export function computeStats(values: number[]): Stats {
  if (values.length === 0) return { count: 0, average: null, lowest: null, highest: null };
  const sum = values.reduce((a, b) => a + b, 0);
  return {
    count: values.length,
    average: Math.round(sum / values.length),
    lowest: Math.min(...values),
    highest: Math.max(...values),
  };
}
