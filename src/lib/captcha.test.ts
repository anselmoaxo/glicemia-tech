import { afterEach, describe, expect, it, vi } from "vitest";
import { captchaEnabled, captchaSiteKey } from "./captcha";

afterEach(() => vi.unstubAllEnvs());

const set = (site?: string, publicSite?: string, secret?: string) => {
  vi.stubEnv("RECAPTCHA_SITE_KEY", site ?? "");
  vi.stubEnv("NEXT_PUBLIC_RECAPTCHA_SITE_KEY", publicSite ?? "");
  vi.stubEnv("RECAPTCHA_SECRET_KEY", secret ?? "");
};

describe("captcha", () => {
  it("liga só com a chave do site E a secreta", () => {
    set("site", undefined, "segredo");
    expect(captchaEnabled()).toBe(true);
    set("site", undefined, undefined);
    expect(captchaEnabled()).toBe(false);
    set(undefined, undefined, "segredo");
    expect(captchaEnabled()).toBe(false);
  });

  it("aceita os dois nomes da chave do site (com e sem NEXT_PUBLIC_)", () => {
    set(undefined, "publica", "segredo");
    expect(captchaSiteKey()).toBe("publica");
    expect(captchaEnabled()).toBe(true);
    set("sem-prefixo", "publica", "segredo");
    expect(captchaSiteKey()).toBe("sem-prefixo"); // o nome sem prefixo tem prioridade
  });

  it("nada configurado: desligado", () => {
    set();
    expect(captchaSiteKey()).toBe("");
    expect(captchaEnabled()).toBe(false);
  });
});
