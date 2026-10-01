import { z } from "zod";

// Conselhos profissionais da saúde e o portal oficial de consulta pública de cada um.
// A conferência é MANUAL (pessoa autorizada consulta o portal): não existe API pública gratuita e estável.
export const COUNCILS = [
  { key: "CRM", label: "CRM (medicina)", portal: "https://portal.cfm.org.br/busca-medicos/" },
  { key: "CRN", label: "CRN (nutrição)", portal: "https://www.cfn.org.br/" },
  { key: "COREN", label: "COREN (enfermagem)", portal: "https://www.cofen.gov.br/" },
  { key: "CRF", label: "CRF (farmácia)", portal: "https://www.cff.org.br/" },
  { key: "CREF", label: "CREF (educação física)", portal: "https://www.confef.org.br/" },
  { key: "CRP", label: "CRP (psicologia)", portal: "https://cadastro.cfp.org.br/" },
] as const;

export const UFS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
] as const;

export const VERIFICATION_LABEL = {
  unverified: "Sem registro informado",
  pending: "Aguardando conferência",
  verified: "Registro verificado",
  rejected: "Registro não confirmado",
} as const;

export const professionalSchema = z.object({
  profession: z.string().trim().min(3, "Informe a profissão").max(60),
  registryCouncil: z.enum(COUNCILS.map((c) => c.key) as [string, ...string[]]).optional().catch(undefined),
  registryUf: z.enum(UFS).optional().catch(undefined),
  registryNumber: z
    .string()
    .trim()
    .max(15, "Registro muito longo")
    .regex(/^[0-9A-Za-z.\-/]*$/, "Use apenas letras, números, ponto, hífen ou barra no registro")
    .transform((v) => v || null),
  bio: z.string().trim().max(500, "Máximo de 500 caracteres").transform((v) => v || null),
});

/** Registro completo (conselho + UF + número) vai para conferência; incompleto fica sem registro. */
export const statusForRegistry = (r: { registryCouncil?: string; registryUf?: string; registryNumber: string | null }) =>
  r.registryCouncil && r.registryUf && r.registryNumber ? ("pending" as const) : ("unverified" as const);
