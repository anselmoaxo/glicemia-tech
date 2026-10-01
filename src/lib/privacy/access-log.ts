import "server-only";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { accessLogs, users } from "@/db/schema";

export type AccessResource = "acompanhamento" | "relatorio";

/** Registra que `viewerId` consultou dados de `ownerId`. Falha de log nunca derruba a página. */
export async function logAccess(ownerId: string, viewerId: string, resource: AccessResource) {
  try {
    await db.insert(accessLogs).values({ ownerId, viewerId, resource });
  } catch {
    // sem detalhes no log: nada de dados de saúde aqui
  }
}

export async function listAccessLogs(ownerId: string, limit = 20) {
  return db
    .select({
      id: accessLogs.id,
      resource: accessLogs.resource,
      createdAt: accessLogs.createdAt,
      viewerName: users.name,
    })
    .from(accessLogs)
    .leftJoin(users, eq(users.id, accessLogs.viewerId))
    .where(eq(accessLogs.ownerId, ownerId))
    .orderBy(desc(accessLogs.createdAt))
    .limit(limit);
}
