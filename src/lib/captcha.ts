// Google reCAPTCHA (v2, "Não sou um robô"). Só é exigido quando as DUAS chaves existem:
//  - NEXT_PUBLIC_RECAPTCHA_SITE_KEY  (pública, aparece no navegador)
//  - RECAPTCHA_SECRET_KEY            (secreta, só no servidor)
// Sem as chaves o app funciona normalmente, sem captcha (útil em desenvolvimento).

export const CAPTCHA_HEADER = "x-captcha-response";

export function captchaSiteKey() {
  return process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "";
}

export function captchaEnabled() {
  return Boolean(process.env.RECAPTCHA_SECRET_KEY && captchaSiteKey());
}
