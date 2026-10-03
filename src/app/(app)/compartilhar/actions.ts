"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { consentLogs, profiles } from "@/db/schema";
import { uuidSchema } from "@/lib/glucose/validation";
import { getProfile } from "@/lib/profile";
import { requireUser } from "@/lib/session";
import { sharingEvent } from "@/lib/sharing/audit";
import { revokeMember } from "@/lib/sharing/manage";
import { majorityStatus } from "@/lib/sharing/rules";

// `ownerId` é o perfil cujo compartilhamento está sendo alterado. Vem do formulário, então NUNCA é confiável:
// manage.ts confere a permissão no banco.
const ownerIdSchema = z.string().min(1).max(64);

export async function revokeFamilyMember(ownerId: string, formData: FormData) {
  const user = await requireUser();
  const owner = ownerIdSchema.safeParse(ownerId);
  const id = uuidSchema.safeParse(formData.get("id"));
  if (!owner.success || !id.success) return;
  await revokeMember(user.id, owner.data, id.data);
  revalidatePath("/compartilhar");
}

/** Ao completar 18 anos, a própria pessoa confirma que revisou quem tem acesso (fica no histórico e nos consentimentos). */
export async function confirmMajorityReview() {
  const user = await requireUser();
  const profile = await getProfile(user.id);
  if (majorityStatus(profile.birthDate).kind !== "adult" || profile.majorityReviewedAt) return;
  await db.batch([
    db.update(profiles).set({ majorityReviewedAt: new Date(), updatedAt: new Date() }).where(eq(profiles.userId, user.id)),
    db.insert(consentLogs).values({ userId: user.id, kind: "majority_review", version: "2026-10" }),
    sharingEvent({ ownerId: user.id, actorId: user.id, action: "majority_review" }),
  ]);
  revalidatePath("/compartilhar");
  revalidatePath("/inicio");
}
