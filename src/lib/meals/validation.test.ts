import { describe, expect, it } from "vitest";
import { mealSchema } from "./validation";

const base = { mealType: "almoco", customType: "", date: "2026-03-10", time: "12:00", description: "Arroz e feijão" };

describe("mealSchema", () => {
  it("aceita refeição padrão", () => {
    expect(mealSchema.safeParse(base).success).toBe(true);
  });
  it("exige descrição", () => {
    expect(mealSchema.safeParse({ ...base, description: "  " }).success).toBe(false);
  });
  it("exige nome quando personalizado", () => {
    expect(mealSchema.safeParse({ ...base, mealType: "personalizado" }).success).toBe(false);
    expect(mealSchema.safeParse({ ...base, mealType: "personalizado", customType: "Ceia" }).success).toBe(true);
  });
});
