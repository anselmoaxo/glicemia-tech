import { describe, expect, it } from "vitest";
import { loginErrorMessage, signupErrorMessage } from "./auth-errors";

describe("mensagens de erro de autenticação", () => {
  it("captcha ausente ou inválido", () => {
    expect(loginErrorMessage({ status: 400, code: "MISSING_RESPONSE" })).toMatch(/robô/);
    expect(signupErrorMessage({ status: 403, code: "VERIFICATION_FAILED" })).toMatch(/robô/);
  });
  it("bloqueio por conta usa a mensagem do servidor; limite por IP usa a genérica", () => {
    expect(loginErrorMessage({ status: 429, message: "Muitas tentativas de entrada. Por segurança, aguarde 15 minutos e tente de novo." })).toMatch(/15 minutos/);
    expect(loginErrorMessage({ status: 429, message: "Too many requests. Please try again later." })).toMatch(/Aguarde um minuto/);
  });
  it("erro comum de senha não revela se o e-mail existe", () => {
    const m = loginErrorMessage({ status: 401, code: "INVALID_EMAIL_OR_PASSWORD" });
    expect(m).toMatch(/e-mail e senha/);
    expect(m).not.toMatch(/não existe|não encontrado/i);
  });
  it("sem erro de detalhe cai no texto padrão", () => {
    expect(loginErrorMessage(undefined)).toMatch(/Não foi possível entrar/);
    expect(signupErrorMessage(null)).toMatch(/criar a conta/);
  });
});
