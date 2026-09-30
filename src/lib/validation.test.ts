import { describe, expect, it } from "vitest";
import { accountStepSchema, profileSchema, signUpSchema } from "./validation";

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

describe("celular", () => {
  const conta = { name: "Ana", email: "a@b.com", password: "12345678" };
  it("obrigatório no primeiro passo do cadastro e guardado em E.164", () => {
    expect(accountStepSchema.safeParse({ ...conta, phone: "" }).success).toBe(false);
    expect(accountStepSchema.parse({ ...conta, phone: "(11) 91234-5678" }).phone).toBe("+5511912345678");
  });
  it("opcional no perfil: vazio vira null, inválido é recusado", () => {
    const base = { name: "Ana", diabetesType: "tipo2", fontScale: "100", birthDate: "" };
    expect(profileSchema.parse({ ...base, phone: "" }).phone).toBeNull();
    expect(profileSchema.parse({ ...base }).phone).toBeNull();
    expect(profileSchema.parse({ ...base, phone: "11912345678" }).phone).toBe("+5511912345678");
    expect(profileSchema.safeParse({ ...base, phone: "123" }).success).toBe(false);
  });
});
