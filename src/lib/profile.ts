import "server-only";
import { eq } from "drizzle-orm";
import { cache } from "react";
import { db } from "@/db";
import { profiles } from "@/db/schema";

/**
 * Perfil do usuário (cria com padrões na primeira vez). Guardado em cache só durante a requisição:
 * o layout e a página pedem o mesmo perfil e ele é consultado uma vez, sem escrita a cada navegação.
 */
export const getProfile = cache(async (userId: string) => {
  const [existing] = await db.select().from(profiles).where(eq(profiles.userId, userId));
  if (existing) return existing;
  await db.insert(profiles).values({ userId }).onConflictDoNothing();
  const [created] = await db.select().from(profiles).where(eq(profiles.userId, userId));
  return created;
});

/** Fuso de outro usuário (somente leitura; não cria perfil). */
export const getTimezone = cache(async (userId: string) => {
  const [row] = await db
    .select({ timezone: profiles.timezone })
    .from(profiles)
    .where(eq(profiles.userId, userId));
  return row?.timezone ?? "America/Sao_Paulo";
});
