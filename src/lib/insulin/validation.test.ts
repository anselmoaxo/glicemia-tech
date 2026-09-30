import { describe, expect, it } from "vitest";
import { insulinSchema } from "./validation";

const base = {
  units: "10",
  typeId: "novo",
  newType: "NPH",
  date: "2026-03-10",
  time: "07:00",
  mealRelation: "antes_refeicao",
  site: "",
  notes: "",
};

describe("insulinSchema", () => {
  it("aceita novo tipo e converte campos vazios em null", () => {
    const r = insulinSchema.parse(base);
    expect(r.site).toBeNull();
    expect(r.notes).toBeNull();
  });
  it("aceita meias unidades, rejeita outras frações e excesso", () => {
    expect(insulinSchema.safeParse({ ...base, units: "4.5" }).success).toBe(true);
    expect(insulinSchema.safeParse({ ...base, units: "4.3" }).success).toBe(false);
    expect(insulinSchema.safeParse({ ...base, units: "301" }).success).toBe(false);
  });
  it("exige nome do novo tipo e uuid válido do tipo existente", () => {
    expect(insulinSchema.safeParse({ ...base, newType: " " }).success).toBe(false);
    expect(insulinSchema.safeParse({ ...base, typeId: "abc" }).success).toBe(false);
    expect(
      insulinSchema.safeParse({ ...base, typeId: "8b1d5f0e-3c2a-4d6b-9e1f-0a2b3c4d5e6f" }).success,
    ).toBe(true);
  });
});
