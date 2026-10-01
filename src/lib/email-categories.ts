// Situações em que o app envia e-mail. "Essencial" = segurança e acesso à conta: não pode ser desligado.
export const EMAIL_CATEGORIES = {
  verificacao: { label: "Confirmação de cadastro", essential: true },
  senha: { label: "Recuperação de senha", essential: true },
  seguranca: { label: "Aviso de segurança da conta", essential: true },
  duas_etapas: { label: "Código da verificação em duas etapas", essential: true },
  convite: { label: "Convite para familiar ou acompanhante", essential: true },
  responsavel: { label: "Confirmação do responsável legal", essential: true },
  alerta_medicao: { label: "Aviso de medição fora da faixa pessoal", essential: false },
  lembrete_medicao: { label: "Lembrete para medir", essential: false },
  medicao_esquecida: { label: "Medição prevista sem registro", essential: false },
  medicamento_sem_confirmacao: { label: "Medicamento ou insulina sem confirmação", essential: false },
} as const;

export type EmailCategory = keyof typeof EMAIL_CATEGORIES;

export const categoryLabel = (c: string) => EMAIL_CATEGORIES[c as EmailCategory]?.label ?? c;

export const EMAIL_STATUS_LABEL = {
  pending: "Aguardando envio",
  sent: "Enviado ao provedor (entrega não confirmada)",
  delivered: "Entregue",
  delayed: "Entrega atrasada",
  rejected: "Rejeitado",
  failed: "Falhou",
  unknown: "Desconhecido",
} as const;

export type EmailStatus = keyof typeof EMAIL_STATUS_LABEL;
