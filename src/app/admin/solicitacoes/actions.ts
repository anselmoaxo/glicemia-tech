"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { familyMembers, supportRequests, users } from "@/db/schema";
import { logAdminAction, requireAdmin } from "@/lib/admin";
import { uuidSchema } from "@/lib/glucose/validation";

export async function updateRequestStatus(formData: FormData) {
  const admin = await requireAdmin();
  const id = uuidSchema.safeParse(formData.get("id"));
  const status = z.enum(["open", "in_progress", "done"]).safeParse(formData.get("status"));
  if (!id.success || !status.success) return;

  const [target] = await db
    .select({ email: users.email })
    .from(supportRequests)
    .innerJoin(users, eq(users.id, supportRequests.userId))
    .where(eq(supportRequests.id, id.data));
  if (!target) return;

  await db
    .update(supportRequests)
    .set({ status: status.data, resolvedAt: status.data === "done" ? new Date() : null })
    .where(eq(supportRequests.id, id.data));
  await logAdminAction(admin.id, "request_update", target.email);
  revalidatePath("/admin/solicitacoes");
}

/** Revoga um vínculo familiar (ex.: denúncia de abuso). Sempre auditado. */
export async function revokeLink(formData: FormData) {
  const admin = await requireAdmin();
  const id = uuidSchema.safeParse(formData.get("id"));
  if (!id.success) return;
  const [target] = await db
    .select({ email: users.email })
    .from(familyMembers)
    .innerJoin(users, eq(users.id, familyMembers.ownerId))
    .where(eq(familyMembers.id, id.data));
  if (!target) return;
  await db.update(familyMembers).set({ status: "revoked" }).where(eq(familyMembers.id, id.data));
  await logAdminAction(admin.id, "link_revoke", target.email);
  revalidatePath("/admin/solicitacoes");
}
