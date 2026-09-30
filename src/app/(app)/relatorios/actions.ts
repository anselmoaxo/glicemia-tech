"use server";

import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { sharedReports } from "@/db/schema";
import { env } from "@/lib/env";
import { uuidSchema } from "@/lib/glucose/validation";
import { getProfile } from "@/lib/profile";
import { resolveRange } from "@/lib/reports/range";
import { requireUser } from "@/lib/session";
import { addDays, generateToken } from "@/lib/sharing/tokens";

export type ShareLinkState = { error?: string; link?: string };

const VALIDITY_DAYS = [1, 7, 30];
const MAX_ACTIVE_LINKS = 20;

export async function createSharedReport(_: ShareLinkState, formData: FormData): Promise<ShareLinkState> {
  const user = await requireUser();
  const { timezone } = await getProfile(user.id);

  const str = (k: string) => (formData.get(k) ? String(formData.get(k)) : null);
  const range = resolveRange({ dias: str("dias"), from: str("from"), to: str("to") }, timezone);
  if (!range) return { error: "Período inválido (máximo de 366 dias)" };

  const validity = Number(formData.get("validade"));
  if (!VALIDITY_DAYS.includes(validity)) return { error: "Escolha a validade do link" };

  const active = await db
    .select({ id: sharedReports.id })
    .from(sharedReports)
    .where(and(eq(sharedReports.userId, user.id), isNull(sharedReports.revokedAt)));
  if (active.length >= MAX_ACTIVE_LINKS) return { error: "Muitos links ativos. Revogue algum antes." };

  const { token, hash } = generateToken();
  await db.insert(sharedReports).values({
    userId: user.id,
    tokenHash: hash,
    fromDate: range.fromDate,
    toDate: range.toDate,
    expiresAt: addDays(validity),
  });

  revalidatePath("/relatorios");
  // O token só existe aqui: é exibido uma única vez ao paciente.
  return { link: `${env.BETTER_AUTH_URL}/r/${token}` };
}

export async function revokeSharedReport(formData: FormData) {
  const user = await requireUser();
  const id = uuidSchema.safeParse(formData.get("id"));
  if (!id.success) return;
  await db
    .update(sharedReports)
    .set({ revokedAt: new Date() })
    .where(and(eq(sharedReports.id, id.data), eq(sharedReports.userId, user.id)));
  revalidatePath("/relatorios");
}
