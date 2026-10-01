"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { sessions, users } from "@/db/schema";
import { isOwner, logAdminAction, requireAdmin, requireOwner, roleOf } from "@/lib/admin";

export type AdminState = { error?: string };

const cleanId = (raw: FormDataEntryValue | null) => (typeof raw === "string" && raw.length > 0 && raw.length <= 64 ? raw : null);

/** Localiza a conta alvo; administradores não podem agir sobre si mesmos nem sobre outros administradores. */
async function getTarget(adminId: string, raw: FormDataEntryValue | null) {
  const id = cleanId(raw);
  if (!id || id === adminId) return null;
  const [target] = await db
    .select({ id: users.id, email: users.email, emailVerified: users.emailVerified, adminSince: users.adminSince })
    .from(users)
    .where(eq(users.id, id));
  if (!target || roleOf(target.id, target.adminSince) !== "user") return null; // conta de administrador é protegida
  return target;
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

/** Encerra todas as sessões abertas da conta (a pessoa precisa entrar de novo). */
export async function endSessions(formData: FormData) {
  const admin = await requireAdmin();
  const target = await getTarget(admin.id, formData.get("id"));
  if (!target) return;
  await db.delete(sessions).where(eq(sessions.userId, target.id));
  await logAdminAction(admin.id, "end_sessions", target.email);
  revalidatePath("/admin", "layout");
}

/** Confirma o e-mail à mão (ex.: quando o envio de e-mails não funcionou). Só quando ainda não está confirmado. */
export async function verifyEmailManually(formData: FormData) {
  const admin = await requireAdmin();
  const target = await getTarget(admin.id, formData.get("id"));
  if (!target || target.emailVerified) return;
  await db.update(users).set({ emailVerified: true, updatedAt: new Date() }).where(eq(users.id, target.id));
  await logAdminAction(admin.id, "verify_email", target.email);
  revalidatePath("/admin", "layout");
}

async function ownerTarget(adminId: string, raw: FormDataEntryValue | null) {
  const id = cleanId(raw);
  if (!id || id === adminId || isOwner(id)) return null; // ninguém altera o próprio papel nem o de um proprietário
  const [target] = await db
    .select({ id: users.id, email: users.email, emailVerified: users.emailVerified, adminSince: users.adminSince, suspendedAt: users.suspendedAt })
    .from(users)
    .where(eq(users.id, id));
  return target ?? null;
}

/** Só o proprietário. A conta precisa estar ativa e com e-mail confirmado; o acesso ao painel ainda exige 2FA. */
export async function grantAdmin(formData: FormData) {
  const owner = await requireOwner();
  const target = await ownerTarget(owner.id, formData.get("id"));
  if (!target || target.adminSince || target.suspendedAt || !target.emailVerified) return;
  await db.update(users).set({ adminSince: new Date() }).where(eq(users.id, target.id));
  await logAdminAction(owner.id, "role_grant", target.email);
  revalidatePath("/admin", "layout");
}

export async function revokeAdmin(formData: FormData) {
  const owner = await requireOwner();
  const target = await ownerTarget(owner.id, formData.get("id"));
  if (!target || !target.adminSince) return;
  await db.update(users).set({ adminSince: null }).where(eq(users.id, target.id));
  await db.delete(sessions).where(eq(sessions.userId, target.id)); // perde o acesso já na próxima requisição
  await logAdminAction(owner.id, "role_revoke", target.email);
  revalidatePath("/admin", "layout");
}
