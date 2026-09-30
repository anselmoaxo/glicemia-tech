import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { sharedReports } from "@/db/schema";
import { getTimezone } from "@/lib/profile";
import { hashToken, isActive } from "@/lib/sharing/tokens";
import { buildRange } from "./range";

/** Resolve o link do médico: só retorna se existir, não expirou e não foi revogado. */
export async function getActiveSharedReport(token: string) {
  if (token.length < 20 || token.length > 100) return null;
  const [row] = await db
    .select()
    .from(sharedReports)
    .where(eq(sharedReports.tokenHash, hashToken(token)));
  if (!row || !isActive({ expiresAt: row.expiresAt, revokedAt: row.revokedAt })) return null;
  const tz = await getTimezone(row.userId);
  return { userId: row.userId, range: buildRange(row.fromDate, row.toDate, tz), expiresAt: row.expiresAt };
}
