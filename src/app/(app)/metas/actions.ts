"use server";

import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { glucoseTargets } from "@/db/schema";
import { validateTargets, type TargetsValidation } from "@/lib/glucose/targets";
import { requireUser } from "@/lib/session";

export type TargetsState = {
  ok?: boolean;
  /** erro por faixa (chave = geral | jejum | pos_refeicao) */
  errors?: TargetsValidation["errors"];
};

export async function saveTargets(_: TargetsState, formData: FormData): Promise<TargetsState> {
  const user = await requireUser();
  const result = validateTargets(Object.fromEntries(formData));
  if (Object.keys(result.errors).length > 0) return { errors: result.errors };

  if (result.clear.length > 0) {
    await db
      .delete(glucoseTargets)
      .where(and(eq(glucoseTargets.userId, user.id), inArray(glucoseTargets.targetKey, result.clear)));
  }
  for (const [targetKey, range] of Object.entries(result.values)) {
    await db
      .insert(glucoseTargets)
      .values({ userId: user.id, targetKey, minMgDl: range.min, maxMgDl: range.max })
      .onConflictDoUpdate({
        target: [glucoseTargets.userId, glucoseTargets.targetKey],
        set: { minMgDl: range.min, maxMgDl: range.max, updatedAt: new Date() },
      });
  }

  revalidatePath("/metas");
  revalidatePath("/glicemia");
  revalidatePath("/inicio");
  return { ok: true };
}
