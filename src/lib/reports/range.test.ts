import { describe, expect, it } from "vitest";
import { resolveRange } from "./range";

const tz = "America/Sao_Paulo";
const now = new Date("2026-03-10T15:00:00Z");

describe("resolveRange", () => {
  it("usa períodos padrão e cai em 30 dias", () => {
    const r = resolveRange({ dias: "7" }, tz, now)!;
    expect(r.fromDate).toBe("2026-03-04");
    expect(r.toDate).toBe("2026-03-10");
    expect(r.days).toBe(7);
    expect(resolveRange({ dias: "5" }, tz, now)!.days).toBe(30);
  });
  it("intervalo personalizado: limita ao hoje e valida", () => {
    const r = resolveRange({ from: "2026-03-01", to: "2026-12-31" }, tz, now)!;
    expect(r.toDate).toBe("2026-03-10");
    expect(resolveRange({ from: "2026-03-09", to: "2026-03-01" }, tz, now)).toBeNull();
    expect(resolveRange({ from: "2020-01-01", to: "2026-03-01" }, tz, now)).toBeNull();
    expect(resolveRange({ from: "x", to: "y" }, tz, now)).toBeNull();
  });
  it("fronteiras em UTC seguem o fuso", () => {
    const r = resolveRange({ from: "2026-03-09", to: "2026-03-09" }, tz, now)!;
    expect(r.from.toISOString()).toBe("2026-03-09T03:00:00.000Z");
    expect(r.to.toISOString()).toBe("2026-03-10T03:00:00.000Z");
  });
});
