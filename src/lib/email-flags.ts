// Sem server-only: também é lido por páginas para decidir o que mostrar.
/** O app manda e-mails? (chave do Resend presente) */
export const emailEnabled = () => Boolean(process.env.RESEND_API_KEY);

/**
 * Exigir e-mail confirmado para entrar. Só vale com o envio de e-mail configurado e com
 * REQUIRE_EMAIL_VERIFICATION=true, para ninguém ficar sem acesso se o Resend ainda não funcionar.
 */
export const emailVerificationRequired = () => process.env.REQUIRE_EMAIL_VERIFICATION === "true" && emailEnabled();
