import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { profiles } from "@/db/schema";

/** Retorna o perfil do usuário, criando-o com padrões se ainda não existir. */
export async function getProfile(userId: string) {
  await db.insert(profiles).values({ userId }).onConflictDoNothing();
  const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId));
  return profile;
}

/** Fuso de outro usuário (somente leitura; não cria perfil). */
export async function getTimezone(userId: string) {
  const [row] = await db
    .select({ timezone: profiles.timezone })
    .from(profiles)
    .where(eq(profiles.userId, userId));
  return row?.timezone ?? "America/Sao_Paulo";
}
