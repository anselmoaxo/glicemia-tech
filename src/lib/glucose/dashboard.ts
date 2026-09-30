import "server-only";
import { and, avg, count, desc, eq, gte, max, min } from "drizzle-orm";
import { db } from "@/db";
import { glucoseContexts, glucoseReadings } from "@/db/schema";

// Sempre filtrado por userId. Agregações feitas no banco; série do gráfico limitada.

const CHART_MAX_POINTS = 500;

export async function getLatestReading(userId: string) {
  const [row] = await db
    .select({
      value: glucoseReadings.valueMgDl,
      measuredAt: glucoseReadings.measuredAt,
      contextKey: glucoseReadings.contextKey,
      customLabel: glucoseContexts.label,
    })
    .from(glucoseReadings)
    .leftJoin(glucoseContexts, eq(glucoseReadings.customContextId, glucoseContexts.id))
    .where(eq(glucoseReadings.userId, userId))
    .orderBy(desc(glucoseReadings.measuredAt))
    .limit(1);
  return row ?? null;
}

export async function getPeriodStats(userId: string, since: Date) {
  const [row] = await db
    .select({
      average: avg(glucoseReadings.valueMgDl),
      lowest: min(glucoseReadings.valueMgDl),
      highest: max(glucoseReadings.valueMgDl),
      total: count(),
    })
    .from(glucoseReadings)
    .where(and(eq(glucoseReadings.userId, userId), gte(glucoseReadings.measuredAt, since)));
  return {
    average: row.average === null ? null : Math.round(Number(row.average)),
    lowest: row.lowest,
    highest: row.highest,
    total: row.total,
  };
}

export async function getChartSeries(userId: string, since: Date) {
  const rows = await db
    .select({ t: glucoseReadings.measuredAt, value: glucoseReadings.valueMgDl })
    .from(glucoseReadings)
    .where(and(eq(glucoseReadings.userId, userId), gte(glucoseReadings.measuredAt, since)))
    .orderBy(desc(glucoseReadings.measuredAt))
    .limit(CHART_MAX_POINTS);
  return rows.reverse().map((r) => ({ t: r.t.getTime(), value: r.value }));
}
