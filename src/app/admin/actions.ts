"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { sessions, users } from "@/db/schema";
import { isAdmin, logAdminAction, requireAdmin } from "@/lib/admin";

export type AdminState = { error?: string };

/** Localiza a conta alvo; administradores não podem agir sobre si mesmos nem sobre outros administradores. */
async function getTarget(adminId: string, raw: FormDataEntryValue | null) {
  const id = typeof raw === "string" && raw.length > 0 && raw.length <= 64 ? raw : null;
  if (!id || id === adminId || isAdmin(id)) return null;
  const [target] = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(eq(users.id, id));
  return target ?? null;
}

export async function suspendUser(formData: FormData) {
  const admin = await requireAdmin();
  const target = await getTarget(admin.id, formData.get("id"));
  if (!target) return;

  await db.update(users).set({ suspendedAt: new Date() }).where(eq(users.id, target.id));
  await db.delete(sessions).where(eq(sessions.userId, target.id)); // derruba quem já está logado
  await logAdminAction(admin.id, "suspend", target.email);
  revalidatePath("/admin", "layout");
}

export async function unsuspendUser(formData: FormData) {
  const admin = await requireAdmin();
  const target = await getTarget(admin.id, formData.get("id"));
  if (!target) return;

  await db.update(users).set({ suspendedAt: null }).where(eq(users.id, target.id));
  await logAdminAction(admin.id, "unsuspend", target.email);
  revalidatePath("/admin", "layout");
}

/** Exclusão definitiva (cascade apaga todos os dados da conta). Exige digitar o e-mail da conta. */
export async function deleteUser(_: AdminState, formData: FormData): Promise<AdminState> {
  const admin = await requireAdmin();
  const target = await getTarget(admin.id, formData.get("id"));
  if (!target) return { error: "Conta não encontrada ou protegida." };

  const typed = String(formData.get("confirmEmail") ?? "").trim().toLowerCase();
  if (typed !== target.email.toLowerCase()) return { error: "O e-mail digitado não confere." };

  await logAdminAction(admin.id, "delete", target.email);
  await db.delete(users).where(eq(users.id, target.id));
  revalidatePath("/admin", "layout");
  redirect("/admin/usuarios");
}
