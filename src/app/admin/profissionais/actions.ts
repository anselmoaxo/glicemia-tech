"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { professionalProfiles, users } from "@/db/schema";
import { logAdminAction, requireAdmin } from "@/lib/admin";

/** Decisão manual do administrador, depois de conferir conselho, UF, número e nome no portal oficial. */
export async function decideProfessional(formData: FormData) {
  const admin = await requireAdmin();
  const userId = z.string().min(1).max(64).safeParse(formData.get("userId"));
  const decision = z.enum(["verified", "rejected"]).safeParse(formData.get("decision"));
  if (!userId.success || !decision.success) return;
  // quem decide precisa confirmar que conferiu no portal
  if (formData.get("conferido") !== "on") return;

  const [target] = await db
    .select({ email: users.email, status: professionalProfiles.verificationStatus })
    .from(professionalProfiles)
    .innerJoin(users, eq(users.id, professionalProfiles.userId))
    .where(eq(professionalProfiles.userId, userId.data));
  if (!target || target.status !== "pending") return; // só decide o que está aguardando
  if (userId.data === admin.id) return; // ninguém verifica o próprio registro

  await db
    .update(professionalProfiles)
    .set({
      verificationStatus: decision.data,
      verifiedAt: decision.data === "verified" ? new Date() : null,
      verifiedBy: admin.id,
      updatedAt: new Date(),
    })
    .where(eq(professionalProfiles.userId, userId.data));
  await logAdminAction(admin.id, decision.data === "verified" ? "professional_verify" : "professional_reject", target.email);
  revalidatePath("/admin/profissionais");
}
