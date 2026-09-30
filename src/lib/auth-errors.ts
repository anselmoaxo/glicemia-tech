export type AuthError = { status?: number; message?: string; code?: string } | null | undefined;

const CAPTCHA_CODES = new Set(["MISSING_RESPONSE", "VERIFICATION_FAILED"]);

export const CAPTCHA_REQUIRED = "Marque a caixa “Não sou um robô” para continuar.";

function common(e: NonNullable<AuthError>): string | null {
  if (e.code && CAPTCHA_CODES.has(e.code)) return "Não foi possível confirmar que você não é um robô. Marque a caixa de novo e tente outra vez.";
  if (e.code === "UNKNOWN_ERROR") return "Não foi possível fazer a verificação de segurança agora. Tente novamente em instantes.";
  if (e.status === 429) {
    // a mensagem do bloqueio por conta já vem em português do servidor
    return e.message?.startsWith("Muitas") ? e.message : "Muitas tentativas em pouco tempo. Aguarde um minuto e tente de novo.";
  }
  return null;
}

export function loginErrorMessage(e: AuthError) {
  if (e?.code === "EMAIL_NOT_VERIFIED") {
    return "Confirme seu e-mail para entrar. Enviamos um novo link para a sua caixa de entrada (veja também o spam).";
  }
  return (e && common(e)) ?? "Não foi possível entrar. Confira e-mail e senha; se estiver correto, a conta pode estar suspensa.";
}

export function signupErrorMessage(e: AuthError) {
  return (e && common(e)) ?? "Não foi possível criar a conta. Se você já tem cadastro, entre com seu e-mail.";
}

