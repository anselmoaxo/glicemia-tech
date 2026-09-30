import "server-only";
import { createHmac } from "node:crypto";
import { eq, lt } from "drizzle-orm";
import { db } from "@/db";
import { loginAttempts } from "@/db/schema";
import { afterFailure, type AttemptState } from "./login-lock";

/** HMAC do e-mail normalizado: o endereço não é guardado nesta tabela. */
export function attemptKey(email: string, secret: string) {
  return createHmac("sha256", secret).update(email.trim().toLowerCase()).digest("hex");
}

export async function getAttemptState(key: string): Promise<AttemptState | null> {
  const [row] = await db.select().from(loginAttempts).where(eq(loginAttempts.key, key));
  return row ? { failures: row.failures, windowStart: row.windowStart, lockedUntil: row.lockedUntil } : null;
}

export async function recordFailure(key: string) {
  const next = afterFailure(await getAttemptState(key));
  await db
    .insert(loginAttempts)
    .values({ key, ...next, updatedAt: new Date() })
    .onConflictDoUpdate({ target: loginAttempts.key, set: { ...next, updatedAt: new Date() } });
  // limpeza oportunista de registros antigos (mais de 1 dia)
  await db.delete(loginAttempts).where(lt(loginAttempts.updatedAt, new Date(Date.now() - 24 * 60 * 60 * 1000)));
  return next;
}

export async function clearAttempts(key: string) {
  await db.delete(loginAttempts).where(eq(loginAttempts.key, key));
}
