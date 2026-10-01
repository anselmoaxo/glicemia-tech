import type { Metadata } from "next";
import { AssistantChat } from "@/components/assistant-chat";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Assistente" };

export default async function AssistentePage() {
  await requireUser();
  return (
    <section className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold">Assistente educativo</h1>
      <p className="rounded-2xl border bg-card p-4 text-base">
        Tira dúvidas sobre diabetes, glicose, medições e carboidratos. É conteúdo educativo: não diagnostica, não indica
        medicamentos nem doses e não substitui médico, nutricionista ou outro profissional de saúde. A conversa não é
        salva e o assistente não usa suas medições. Em caso de urgência, procure atendimento (no Brasil, SAMU 192).
      </p>
      <AssistantChat />
    </section>
  );
}
