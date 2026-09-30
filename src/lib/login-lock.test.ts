import { describe, expect, it } from "vitest";
import { afterFailure, LOCK_POLICY, lockMessage, lockStatus, type AttemptState } from "./login-lock";

const t0 = new Date("2026-03-10T12:00:00Z");
const at = (ms: number) => new Date(t0.getTime() + ms);

function fail(n: number, start = t0, step = 1000): AttemptState | null {
  let s: AttemptState | null = null;
  for (let i = 0; i < n; i++) s = afterFailure(s, new Date(start.getTime() + i * step));
  return s;
}

describe("bloqueio por tentativas", () => {
  it("não bloqueia antes do limite e bloqueia na 5ª falha", () => {
    expect(lockStatus(fail(4), at(5000)).locked).toBe(false);
    const s = fail(5);
    expect(s?.lockedUntil).not.toBeNull();
    const st = lockStatus(s, at(5000));
    expect(st.locked).toBe(true);
    expect(st.retryAfterSec).toBeGreaterThan(14 * 60);
  });

  it("o bloqueio termina depois do tempo e a contagem recomeça", () => {
    const s = fail(5);
    const later = at(LOCK_POLICY.lockMs + 10_000);
    expect(lockStatus(s, later).locked).toBe(false);
    const again = afterFailure(s, later);
    expect(again.failures).toBe(1);
    expect(again.lockedUntil).toBeNull();
  });

  it("falhas antigas (fora da janela) não se acumulam", () => {
    const s = fail(4);
    const muito = at(LOCK_POLICY.windowMs + 1000);
    expect(afterFailure(s, muito).failures).toBe(1);
  });

  it("sem histórico não está bloqueado", () => {
    expect(lockStatus(null, t0).locked).toBe(false);
  });

  it("mensagem em minutos, no singular e no plural", () => {
    expect(lockMessage(30)).toMatch(/1 minuto\b/);
    expect(lockMessage(15 * 60)).toMatch(/15 minutos/);
  });
});
