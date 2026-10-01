import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { rateLimits } from "@/db/schema";

/** Janela fixa por usuário, no banco (a memória não serve na Vercel). Retorna false se passou do limite. */
export async function allowAssistantUse(userId: string, windowSec = 60, max = 15) {
  const key = `assistant:${userId}`;
  const now = Date.now();
  const [row] = await db.select().from(rateLimits).where(eq(rateLimits.key, key));
  if (!row || now - row.lastRequest > windowSec * 1000) {
    await db
      .insert(rateLimits)
      .values({ id: key, key, count: 1, lastRequest: now })
      .onConflictDoUpdate({ target: rateLimits.key, set: { count: 1, lastRequest: now } });
    return true;
  }
  if (row.count >= max) return false;
  await db.update(rateLimits).set({ count: row.count + 1 }).where(eq(rateLimits.key, key));
  return true;
}
