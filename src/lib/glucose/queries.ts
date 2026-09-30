import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { glucoseContexts, glucoseReadings, glucoseTargets } from "@/db/schema";
import type { Targets } from "./classify";
import { TARGET_KEYS } from "./contexts";

// Toda consulta filtra por userId: isolamento entre usuários garantido no backend.

export const PAGE_SIZE = 20;

const readingColumns = {
  id: glucoseReadings.id,
  value: glucoseReadings.valueMgDl,
  measuredAt: glucoseReadings.measuredAt,
  contextKey: glucoseReadings.contextKey,
  customLabel: glucoseContexts.label,
  notes: glucoseReadings.notes,
  symptoms: glucoseReadings.symptoms,
  activity: glucoseReadings.activity,
};

export async function listReadings(userId: string, page: number) {
  const rows = await db
    .select(readingColumns)
    .from(glucoseReadings)
    .leftJoin(glucoseContexts, eq(glucoseReadings.customContextId, glucoseContexts.id))
    .where(eq(glucoseReadings.userId, userId))
    .orderBy(desc(glucoseReadings.measuredAt))
    .limit(PAGE_SIZE + 1)
    .offset((page - 1) * PAGE_SIZE);
  return { items: rows.slice(0, PAGE_SIZE), hasMore: rows.length > PAGE_SIZE };
}

export async function getReading(userId: string, id: string) {
  const [row] = await db
    .select(readingColumns)
    .from(glucoseReadings)
    .leftJoin(glucoseContexts, eq(glucoseReadings.customContextId, glucoseContexts.id))
    .where(and(eq(glucoseReadings.id, id), eq(glucoseReadings.userId, userId)));
  return row ?? null;
}

export async function getTargets(userId: string): Promise<Targets> {
  const rows = await db.select().from(glucoseTargets).where(eq(glucoseTargets.userId, userId));
  const valid = new Set<string>(TARGET_KEYS.map((t) => t.key));
  const targets: Targets = {};
  for (const r of rows) {
    if (valid.has(r.targetKey)) {
      targets[r.targetKey as keyof Targets] = { min: r.minMgDl, max: r.maxMgDl };
    }
  }
  return targets;
}

/** Retorna o id do contexto personalizado do usuário, criando-o se necessário. */
export async function findOrCreateCustomContext(userId: string, label: string) {
  await db.insert(glucoseContexts).values({ userId, label }).onConflictDoNothing();
  const [row] = await db
    .select({ id: glucoseContexts.id })
    .from(glucoseContexts)
    .where(and(eq(glucoseContexts.userId, userId), eq(glucoseContexts.label, label)));
  return row.id;
}
