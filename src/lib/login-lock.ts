// Bloqueio por conta depois de várias senhas erradas. Regras puras (sem banco), fáceis de testar.

export const LOCK_POLICY = {
  /** falhas seguidas que disparam o bloqueio */
  maxFailures: 5,
  /** as falhas só contam dentro desta janela */
  windowMs: 15 * 60 * 1000,
  /** duração do bloqueio */
  lockMs: 15 * 60 * 1000,
} as const;

export type AttemptState = { failures: number; windowStart: Date; lockedUntil: Date | null };

export function lockStatus(state: AttemptState | null, now = new Date()) {
  if (state?.lockedUntil && state.lockedUntil.getTime() > now.getTime()) {
    return { locked: true as const, retryAfterSec: Math.ceil((state.lockedUntil.getTime() - now.getTime()) / 1000) };
  }
  return { locked: false as const, retryAfterSec: 0 };
}

/** Novo estado depois de uma senha errada. */
export function afterFailure(state: AttemptState | null, now = new Date()): AttemptState {
  const expired =
    !state ||
    (state.lockedUntil !== null && state.lockedUntil.getTime() <= now.getTime()) || // bloqueio anterior terminou
    now.getTime() - state.windowStart.getTime() >= LOCK_POLICY.windowMs; // falhas antigas não contam
  const failures = expired ? 1 : state.failures + 1;
  const windowStart = expired ? now : state.windowStart;
  const lockedUntil = failures >= LOCK_POLICY.maxFailures ? new Date(now.getTime() + LOCK_POLICY.lockMs) : null;
  return { failures, windowStart, lockedUntil };
}

export function lockMessage(retryAfterSec: number) {
  const minutes = Math.max(1, Math.ceil(retryAfterSec / 60));
  return `Muitas tentativas de entrada. Por segurança, aguarde ${minutes} ${minutes === 1 ? "minuto" : "minutos"} e tente de novo.`;
}
