import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { meals } from "@/db/schema";

// Toda consulta filtra por userId.
export const MEALS_PAGE_SIZE = 20;

export async function listMeals(userId: string, page: number) {
  const rows = await db
    .select()
    .from(meals)
    .where(eq(meals.userId, userId))
    .orderBy(desc(meals.eatenAt))
    .limit(MEALS_PAGE_SIZE + 1)
    .offset((page - 1) * MEALS_PAGE_SIZE);
  return { items: rows.slice(0, MEALS_PAGE_SIZE), hasMore: rows.length > MEALS_PAGE_SIZE };
}

export async function getMeal(userId: string, id: string) {
  const [row] = await db
    .select()
    .from(meals)
    .where(and(eq(meals.id, id), eq(meals.userId, userId)));
  return row ?? null;
}

export async function getLastMeal(userId: string) {
  const [row] = await db
    .select()
    .from(meals)
    .where(eq(meals.userId, userId))
    .orderBy(desc(meals.eatenAt))
    .limit(1);
  return row ?? null;
}
