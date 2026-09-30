import { describe, expect, it } from "vitest";
import { profileSchema, signUpSchema } from "./validation";

describe("signUpSchema", () => {
  it("rejeita senha curta e e-mail inválido", () => {
    expect(signUpSchema.safeParse({ name: "Ana", email: "x", password: "12345678" }).success).toBe(false);
    expect(signUpSchema.safeParse({ name: "Ana", email: "a@b.com", password: "123" }).success).toBe(false);
  });
});

describe("profileSchema", () => {
  const base = { name: "Ana", diabetesType: "tipo2", fontScale: "125" };
  it("aceita data vazia como null e converte fontScale", () => {
    const r = profileSchema.parse({ ...base, birthDate: "" });
    expect(r.birthDate).toBeNull();
    expect(r.fontScale).toBe(125);
  });
  it("rejeita data futura e escala fora da faixa", () => {
    expect(profileSchema.safeParse({ ...base, birthDate: "2999-01-01" }).success).toBe(false);
    expect(profileSchema.safeParse({ ...base, birthDate: "", fontScale: "300" }).success).toBe(false);
  });
});
