/**
 * Regra de gratuidade da primeira versão: todas as funções do app são gratuitas. Não há cobrança, assinatura, limite pago
 * nem integração de pagamento, e nenhum acesso depende de pagamento.
 *
 * Os limites que existem (ex.: acompanhantes por perfil, em app_settings) são de segurança e privacidade, não comerciais.
 * Se um dia houver planos, a decisão entra aqui (e nos pontos que a consultarem) sem reescrever permissões nem dados.
 */
export const CURRENT_PLAN = { key: "gratuito", label: "Gratuito", paid: false } as const;
