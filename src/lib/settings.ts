import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { appSettings } from "@/db/schema";
import { normalizeMaxCompanions } from "@/lib/sharing/rules";

/** Limite de acompanhantes por perfil (Admin > Configurações). Sem linha ou valor inválido = padrão. */
export async function getMaxCompanions(): Promise<number> {
  const [row] = await db.select({ value: appSettings.value }).from(appSettings).where(eq(appSettings.key, "max_companions"));
  return normalizeMaxCompanions(row?.value);
}

export async function setMaxCompanions(value: number, adminId: string) {
  await db
    .insert(appSettings)
    .values({ key: "max_companions", value, updatedBy: adminId })
    .onConflictDoUpdate({ target: appSettings.key, set: { value, updatedBy: adminId, updatedAt: new Date() } });
}
