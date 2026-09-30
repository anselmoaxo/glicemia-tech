import "server-only";
import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { insulinLogs, insulinTypes } from "@/db/schema";

// Toda consulta filtra por userId.
export const INSULIN_PAGE_SIZE = 20;

const logColumns = {
  id: insulinLogs.id,
  units: insulinLogs.units,
  appliedAt: insulinLogs.appliedAt,
  mealRelation: insulinLogs.mealRelation,
  site: insulinLogs.site,
  notes: insulinLogs.notes,
  typeId: insulinLogs.insulinTypeId,
  typeName: insulinTypes.name,
};

export async function listInsulinTypes(userId: string) {
  return db
    .select({ id: insulinTypes.id, name: insulinTypes.name })
    .from(insulinTypes)
    .where(eq(insulinTypes.userId, userId))
    .orderBy(asc(insulinTypes.name));
}

export async function listInsulinLogs(userId: string, page: number) {
  const rows = await db
    .select(logColumns)
    .from(insulinLogs)
    .innerJoin(insulinTypes, eq(insulinLogs.insulinTypeId, insulinTypes.id))
    .where(eq(insulinLogs.userId, userId))
    .orderBy(desc(insulinLogs.appliedAt))
    .limit(INSULIN_PAGE_SIZE + 1)
    .offset((page - 1) * INSULIN_PAGE_SIZE);
  return { items: rows.slice(0, INSULIN_PAGE_SIZE), hasMore: rows.length > INSULIN_PAGE_SIZE };
}

export async function getInsulinLog(userId: string, id: string) {
  const [row] = await db
    .select(logColumns)
    .from(insulinLogs)
    .innerJoin(insulinTypes, eq(insulinLogs.insulinTypeId, insulinTypes.id))
    .where(and(eq(insulinLogs.id, id), eq(insulinLogs.userId, userId)));
  return row ?? null;
}

export async function getLastInsulinLog(userId: string) {
  const { items } = await listInsulinLogs(userId, 1);
  return items[0] ?? null;
}

/** Resolve o tipo escolhido: valida que pertence ao usuário ou cria um novo. */
export async function resolveInsulinType(userId: string, typeId: string, newName: string) {
  if (typeId === "novo") {
    await db.insert(insulinTypes).values({ userId, name: newName }).onConflictDoNothing();
    const [row] = await db
      .select({ id: insulinTypes.id })
      .from(insulinTypes)
      .where(and(eq(insulinTypes.userId, userId), eq(insulinTypes.name, newName)));
    return row.id;
  }
  const [row] = await db
    .select({ id: insulinTypes.id })
    .from(insulinTypes)
    .where(and(eq(insulinTypes.id, typeId), eq(insulinTypes.userId, userId)));
  return row?.id ?? null;
}
