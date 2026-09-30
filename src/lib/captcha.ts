// Google reCAPTCHA (v2, "Não sou um robô"). Só é exigido quando as DUAS chaves existem:
//  - RECAPTCHA_SITE_KEY (ou NEXT_PUBLIC_RECAPTCHA_SITE_KEY)  chave do site: pública, vai para o navegador
//  - RECAPTCHA_SECRET_KEY                                     chave secreta: só no servidor
// Sem as chaves o app funciona normalmente, sem captcha (útil em desenvolvimento).
//
// A chave do site é lida no servidor e entregue à página por propriedade, então o prefixo NEXT_PUBLIC_
// não é necessário; os dois nomes funcionam.

export const CAPTCHA_HEADER = "x-captcha-response";

export function captchaSiteKey() {
  return process.env.RECAPTCHA_SITE_KEY || process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "";
}

export function captchaEnabled() {
  return Boolean(process.env.RECAPTCHA_SECRET_KEY && captchaSiteKey());
}
