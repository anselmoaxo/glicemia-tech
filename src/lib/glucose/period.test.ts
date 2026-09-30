import { describe, expect, it } from "vitest";
import { parsePeriod, periodStart } from "./period";

describe("period", () => {
  it("aceita só períodos permitidos", () => {
    expect(parsePeriod("30")).toBe(30);
    expect(parsePeriod(["14"])).toBe(14);
    expect(parsePeriod("999")).toBe(7);
    expect(parsePeriod(undefined)).toBe(7);
    expect(parsePeriod("abc")).toBe(7);
  });
  it("calcula o início do período", () => {
    const now = new Date("2026-03-10T12:00:00Z");
    expect(periodStart(7, now).toISOString()).toBe("2026-03-03T12:00:00.000Z");
  });
});
