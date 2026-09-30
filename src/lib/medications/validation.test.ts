import { describe, expect, it } from "vitest";
import { medicationSchema } from "./validation";

const base = { name: "Metformina", dose: "500", unit: "mg", times: ["08:00", "20:00"], days: ["1", "0"], notes: "" };

describe("medicationSchema", () => {
  it("aceita e normaliza dias", () => {
    const r = medicationSchema.parse(base);
    expect(r.days).toEqual([0, 1]);
    expect(r.notes).toBeNull();
  });
  it("rejeita horários repetidos, inválidos e sem dias", () => {
    expect(medicationSchema.safeParse({ ...base, times: ["08:00", "08:00"] }).success).toBe(false);
    expect(medicationSchema.safeParse({ ...base, times: ["25:00"] }).success).toBe(false);
    expect(medicationSchema.safeParse({ ...base, days: [] }).success).toBe(false);
  });
});
