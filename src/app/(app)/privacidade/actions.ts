"use server";

import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { supportRequests } from "@/db/schema";
import { supportSchema } from "@/lib/privacy/support";
import { requireUser } from "@/lib/session";

export type SupportState = { ok?: boolean; error?: string };

const MAX_OPEN = 5;

export async function createSupportRequest(_: SupportState, formData: FormData): Promise<SupportState> {
  const user = await requireUser();
  const parsed = supportSchema.safeParse({ kind: formData.get("kind"), message: formData.get("message") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const [{ open }] = await db
    .select({ open: sql<number>`count(*)::int` })
    .from(supportRequests)
    .where(and(eq(supportRequests.userId, user.id), sql`${supportRequests.status} <> 'done'`));
  if (open >= MAX_OPEN) return { error: "Você já tem solicitações em aberto. Aguarde o retorno antes de enviar outras." };

  await db.insert(supportRequests).values({ userId: user.id, ...parsed.data });
  revalidatePath("/privacidade");
  return { ok: true };
}
