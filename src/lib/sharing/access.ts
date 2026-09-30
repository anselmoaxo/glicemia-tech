import "server-only";
import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { familyMembers, sharingPermissions } from "@/db/schema";
import { SHARE_MODULES, type ShareModule } from "./modules";

const ALL = new Set<ShareModule>(SHARE_MODULES.map((m) => m.key));

/** Módulos que `viewerId` pode ler dos dados de `ownerId` (vazio = sem acesso). */
export async function getAccessibleModules(viewerId: string, ownerId: string): Promise<Set<ShareModule>> {
  if (viewerId === ownerId) return ALL;
  const rows = await db
    .select({ module: sharingPermissions.module })
    .from(familyMembers)
    .innerJoin(sharingPermissions, eq(sharingPermissions.familyMemberId, familyMembers.id))
    .where(
      and(
        eq(familyMembers.ownerId, ownerId),
        eq(familyMembers.memberUserId, viewerId),
        eq(familyMembers.status, "accepted"),
      ),
    );
  return new Set(rows.map((r) => r.module as ShareModule));
}

/** Exige acesso ao módulo; caso contrário responde 404 (não revela a existência do vínculo). */
export async function requireModule(viewerId: string, ownerId: string, module: ShareModule) {
  const modules = await getAccessibleModules(viewerId, ownerId);
  if (!modules.has(module)) notFound();
}
