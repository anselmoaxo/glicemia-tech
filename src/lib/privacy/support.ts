import { z } from "zod";

export const SUPPORT_KINDS = [
  { key: "suporte", label: "Suporte" },
  { key: "privacidade", label: "Dúvida ou pedido sobre privacidade" },
  { key: "exportacao", label: "Cópia dos meus dados" },
  { key: "exclusao", label: "Exclusão da minha conta" },
] as const;

export const STATUS_LABEL = { open: "Aberta", in_progress: "Em andamento", done: "Concluída" } as const;

export const kindLabel = (k: string) => SUPPORT_KINDS.find((x) => x.key === k)?.label ?? k;

export const supportSchema = z.object({
  kind: z.enum(["suporte", "privacidade", "exportacao", "exclusao"], { message: "Escolha o tipo da solicitação" }),
  message: z.string().trim().min(5, "Descreva a solicitação").max(1000, "Máximo de 1000 caracteres"),
});
