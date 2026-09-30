"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { glucoseTargets } from "@/db/schema";
import { TARGET_KEYS } from "@/lib/glucose/contexts";
import { targetsSchema } from "@/lib/glucose/validation";
import { requireUser } from "@/lib/session";

export type TargetsState = { ok?: boolean; error?: string };

export async function saveTargets(_: TargetsState, formData: FormData): Promise<TargetsState> {
  const user = await requireUser();
  const parsed = targetsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Use valores entre 20 e 600 mg/dL" };

  const values = parsed.data as Record<string, number | "">;
  const upserts: { targetKey: string; min: number; max: number }[] = [];
  const clears: string[] = [];

  for (const { key, label } of TARGET_KEYS) {
    const min = values[`${key}_min`];
    const max = values[`${key}_max`];
    if (min === "" && max === "") clears.push(key);
    else if (min === "" || max === "") return { error: `Preencha mínimo e máximo de "${label}"` };
    else if (min >= max) return { error: `Em "${label}", o mínimo deve ser menor que o máximo` };
    else upserts.push({ targetKey: key, min, max });
  }

  for (const key of clears) {
    await db
      .delete(glucoseTargets)
      .where(and(eq(glucoseTargets.userId, user.id), eq(glucoseTargets.targetKey, key)));
  }
  for (const u of upserts) {
    await db
      .insert(glucoseTargets)
      .values({ userId: user.id, targetKey: u.targetKey, minMgDl: u.min, maxMgDl: u.max })
      .onConflictDoUpdate({
        target: [glucoseTargets.userId, glucoseTargets.targetKey],
        set: { minMgDl: u.min, maxMgDl: u.max, updatedAt: new Date() },
      });
  }

  revalidatePath("/metas");
  revalidatePath("/glicemia");
  return { ok: true };
}
