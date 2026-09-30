import { describe, expect, it } from "vitest";
import { safeNext } from "./safe-next";

describe("safeNext", () => {
  it("aceita caminhos internos", () => {
    expect(safeNext("/convite/abc")).toBe("/convite/abc");
  });
  it("rejeita URLs externas e inválidas", () => {
    expect(safeNext("//evil.com")).toBe("/inicio");
    expect(safeNext("https://evil.com")).toBe("/inicio");
    expect(safeNext("/\\evil.com")).toBe("/inicio");
    expect(safeNext(undefined)).toBe("/inicio");
  });
});
