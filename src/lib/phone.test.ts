import { describe, expect, it } from "vitest";
import { formatPhoneDisplay, maskPhone, normalizePhone, tidyPhoneInput } from "./phone";

const ok = (s: string) => {
  const r = normalizePhone(s);
  return r.ok ? r.e164 : `ERRO:${r.message}`;
};

describe("normalizePhone", () => {
  it("aceita os jeitos comuns de digitar e devolve E.164", () => {
    for (const s of ["(11) 91234-5678", "11912345678", "11 91234 5678", "+55 11 91234-5678", "5511912345678", "011 91234-5678", "  (11)91234.5678  "]) {
      expect(ok(s)).toBe("+5511912345678");
    }
  });

  it("rejeita vazio, curto, longo e sem o 9", () => {
    expect(ok("")).toMatch(/^ERRO:Informe/);
    expect(ok("12345")).toMatch(/^ERRO:Celular inválido/);
    expect(ok("119123456789")).toMatch(/^ERRO:Celular inválido/);
    expect(ok("11812345678")).toMatch(/^ERRO:Celular inválido/); // 11 dígitos mas sem o 9 depois do DDD
    expect(ok("abc")).toMatch(/^ERRO:/);
  });

  it("explica quando é telefone fixo", () => {
    expect(ok("(11) 3123-4567")).toMatch(/fixo/);
  });

  it("confere o DDD", () => {
    expect(ok("(00) 91234-5678")).toMatch(/DDD inválido/);
    expect(ok("(10) 91234-5678")).toMatch(/DDD inválido/);
    expect(ok("(21) 91234-5678")).toBe("+5521912345678");
    expect(ok("(92) 99123-4567")).toBe("+5592991234567");
  });

  it("aceita número de outro país só com +", () => {
    expect(ok("+351 912 345 678")).toBe("+351912345678");
    expect(ok("+1 (415) 555-2671")).toBe("+14155552671");
    expect(ok("+12")).toMatch(/^ERRO:Número internacional/);
  });
});

describe("formatação", () => {
  it("formata para exibir e para o campo", () => {
    expect(formatPhoneDisplay("+5511912345678")).toBe("(11) 91234-5678");
    expect(formatPhoneDisplay("+351912345678")).toBe("+351912345678");
    expect(formatPhoneDisplay(null)).toBe("");
    expect(tidyPhoneInput("11912345678")).toBe("(11) 91234-5678");
    expect(tidyPhoneInput("11 9123")).toBe("11 9123"); // inválido: não mexe
  });

  it("mascara para conferência", () => {
    expect(maskPhone("+5511912345678")).toBe("(11) •••••-5678");
    expect(maskPhone(null)).toBe("");
  });
});
