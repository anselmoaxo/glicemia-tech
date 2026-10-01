const TZ = "America/Sao_Paulo";

export const fmtDate = (d: Date | null) =>
  d ? new Intl.DateTimeFormat("pt-BR", { timeZone: TZ, day: "2-digit", month: "2-digit", year: "numeric" }).format(d) : "—";

export const fmtDateTime = (d: Date | null) =>
  d
    ? new Intl.DateTimeFormat("pt-BR", {
        timeZone: TZ,
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(d)
    : "—";

export const ACTION_LABEL = {
  suspend: "Suspendeu",
  unsuspend: "Reativou",
  delete: "Excluiu",
  request_update: "Atualizou solicitação de",
  link_revoke: "Revogou vínculo familiar de",
  professional_verify: "Verificou o registro profissional de",
  professional_reject: "Recusou o registro profissional de",
} as const;
