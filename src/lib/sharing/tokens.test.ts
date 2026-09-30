import { describe, expect, it } from "vitest";
import { addDays, generateToken, hashToken, isActive } from "./tokens";

describe("tokens", () => {
  it("gera tokens únicos e longos; hash confere", () => {
    const a = generateToken();
    const b = generateToken();
    expect(a.token).not.toBe(b.token);
    expect(a.token.length).toBeGreaterThanOrEqual(43);
    expect(hashToken(a.token)).toBe(a.hash);
    expect(a.hash).not.toContain(a.token);
  });
  it("valida expiração e revogação", () => {
    const now = new Date("2026-03-10T12:00:00Z");
    expect(isActive({ expiresAt: addDays(1, now) }, now)).toBe(true);
    expect(isActive({ expiresAt: addDays(-1, now) }, now)).toBe(false);
    expect(isActive({ expiresAt: addDays(1, now), revokedAt: now }, now)).toBe(false);
  });
});
