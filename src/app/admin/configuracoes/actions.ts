"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { logAdminAction, requireAdmin } from "@/lib/admin";
import { setMaxCompanions } from "@/lib/settings";
import { MAX_COMPANIONS_CEILING } from "@/lib/sharing/rules";

export type SettingsState = { ok?: boolean; error?: string };

/** Limite de pessoas com acesso a cada perfil. Vale para convites novos; acessos existentes não são removidos. */
export async function updateMaxCompanions(_: SettingsState, formData: FormData): Promise<SettingsState> {
  const admin = await requireAdmin();
  const value = z.coerce.number().int().min(1).max(MAX_COMPANIONS_CEILING).safeParse(formData.get("maxCompanions"));
  if (!value.success) return { error: `Informe um número de 1 a ${MAX_COMPANIONS_CEILING}.` };
  await setMaxCompanions(value.data, admin.id);
  await logAdminAction(admin.id, "setting_update", `limite de acompanhantes por perfil: ${value.data}`);
  revalidatePath("/admin/configuracoes");
  return { ok: true };
}
