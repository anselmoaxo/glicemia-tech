// Regras de compartilhamento sem acesso ao banco (testáveis isoladamente). Quem consulta o banco é manage.ts.
import { ageFromBirthDate } from "@/lib/profile-utils";
import type { ShareModule } from "./modules";

/** Limite inicial de acompanhantes (inclui responsáveis) por perfil; o administrador ajusta em Admin > Configurações. */
export const DEFAULT_MAX_COMPANIONS = 2;
export const MAX_COMPANIONS_CEILING = 10;

export const INVITE_DAYS = 7;

/** Valor guardado em app_settings -> limite válido (1 a 10). Qualquer coisa estranha volta ao padrão. */
export function normalizeMaxCompanions(value: unknown): number {
  const n = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  if (!Number.isInteger(n) || n < 1 || n > MAX_COMPANIONS_CEILING) return DEFAULT_MAX_COMPANIONS;
  return n;
}

export type MemberRole = "companion" | "guardian";
export type MemberStatus = "pending" | "accepted" | "revoked";

/** Vínculos que ocupam vaga: acessos ativos e convites pendentes ainda válidos (convite expirado libera a vaga). */
export function occupiesSlot(m: { status: string; inviteExpiresAt: Date }, now = new Date()) {
  return m.status === "accepted" || (m.status === "pending" && m.inviteExpiresAt.getTime() > now.getTime());
}

/** Convite pendente que já passou da validade (não pode mais ser aceito). */
export function inviteExpired(m: { status: string; inviteExpiresAt: Date }, now = new Date()) {
  return m.status === "pending" && m.inviteExpiresAt.getTime() <= now.getTime();
}

/**
 * Quem está agindo sobre o compartilhamento de um perfil:
 * - owner: a própria pessoa (adulta ou menor);
 * - guardian: responsável legal confirmado enquanto o titular é menor;
 * - none: qualquer outra pessoa (acompanhante comum, administrador, desconhecido).
 */
export type SharingActor = "owner" | "guardian" | "none";

export type SharingAuthority = {
  canView: boolean;
  canInvite: boolean;
  canEditPermissions: boolean;
  /** Pode revogar/cancelar o vínculo com este papel? */
  canRevoke: (role: MemberRole) => boolean;
};

/**
 * Regras:
 * - Adulto controla tudo do próprio perfil, inclusive revogar o antigo responsável depois dos 18 anos.
 * - Menor vê quem tem acesso e pode revogar acompanhantes (reduzir o compartilhamento), mas não convida, não amplia
 *   permissões e não revoga o responsável legal. Novos compartilhamentos passam pelo responsável.
 * - Responsável legal (só enquanto o titular é menor) convida, ajusta e revoga acompanhantes; não revoga outro responsável.
 * - Ninguém mais administra o compartilhamento: um acompanhante nunca repassa acesso a terceiros.
 */
export function sharingAuthority(actor: SharingActor, ownerIsMinor: boolean): SharingAuthority {
  if (actor === "owner" && !ownerIsMinor) {
    return { canView: true, canInvite: true, canEditPermissions: true, canRevoke: () => true };
  }
  if (actor === "owner") {
    return { canView: true, canInvite: false, canEditPermissions: false, canRevoke: (role) => role === "companion" };
  }
  if (actor === "guardian" && ownerIsMinor) {
    return { canView: true, canInvite: true, canEditPermissions: true, canRevoke: (role) => role === "companion" };
  }
  return { canView: false, canInvite: false, canEditPermissions: false, canRevoke: () => false };
}

/** Menor de 18 anos pela data de nascimento informada (sem data = não presume menoridade). */
export function isMinor(birthDate: string | null, now = new Date()) {
  const age = ageFromBirthDate(birthDate, now);
  return age !== null && age < 18;
}

/** Aviso de maioridade com esta antecedência (dias). */
export const MAJORITY_NOTICE_DAYS = 60;

export type MajorityStatus =
  | { kind: "unknown" }
  | { kind: "minor"; daysTo18: number }
  | { kind: "soon"; daysTo18: number }
  | { kind: "adult" };

/** Situação de maioridade: "soon" = menor a até MAJORITY_NOTICE_DAYS dias de completar 18 anos. */
export function majorityStatus(birthDate: string | null, now = new Date()): MajorityStatus {
  if (!birthDate || !/^\d{4}-\d{2}-\d{2}$/.test(birthDate) || ageFromBirthDate(birthDate, now) === null) return { kind: "unknown" };
  if (!isMinor(birthDate, now)) return { kind: "adult" };
  const [y, m, d] = birthDate.split("-").map(Number);
  const eighteen = new Date(y + 18, m - 1, d);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const daysTo18 = Math.max(1, Math.round((eighteen.getTime() - today.getTime()) / 86_400_000));
  return daysTo18 <= MAJORITY_NOTICE_DAYS ? { kind: "soon", daysTo18 } : { kind: "minor", daysTo18 };
}

/** Responsável sempre lê todos os módulos; acompanhante só os escolhidos. */
export const ROLE_LABEL: Record<MemberRole, string> = { companion: "Acompanhante", guardian: "Responsável legal" };

/** Um registro de mais de `hours` horas não é apresentado como valor atual. */
export const STALE_HOURS = 24;

export function isStale(at: Date | null | undefined, now = new Date(), hours = STALE_HOURS) {
  if (!at) return true;
  return now.getTime() - at.getTime() > hours * 3_600_000;
}

/** O registro chegou ao app bem depois do horário informado (ex.: medição anotada mais tarde)? */
export function registeredLater(measuredAt: Date, createdAt: Date, minutes = 15) {
  return createdAt.getTime() - measuredAt.getTime() > minutes * 60_000;
}

/** Seções do relatório que um leitor pode receber, a partir dos módulos liberados. */
export function reportSections(modules: ReadonlySet<ShareModule>) {
  return {
    glucose: modules.has("glucose"),
    meals: modules.has("meals"),
    medications: modules.has("medications"),
    insulin: modules.has("insulin"),
  };
}

export type ReportSections = ReturnType<typeof reportSections>;
export const ALL_REPORT_SECTIONS: ReportSections = { glucose: true, meals: true, medications: true, insulin: true };
