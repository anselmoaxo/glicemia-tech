"use server";

import { answer, type Reply } from "@/lib/assistant/engine";
import { foodByKey } from "@/lib/assistant/foods";
import { allowAssistantUse } from "@/lib/assistant/limit";
import { requireUser } from "@/lib/session";

/** Sem persistência: a conversa vive só na tela de quem perguntou e nada é gravado nem registrado em log. */
export async function askAssistant(message: string, pendingFood?: string): Promise<Reply> {
  const user = await requireUser();
  if (typeof message !== "string" || message.length > 500) {
    return { kind: "unknown", text: "Use até 500 caracteres por pergunta." };
  }
  if (!(await allowAssistantUse(user.id))) {
    return { kind: "unknown", text: "Muitas perguntas em pouco tempo. Aguarde um minuto e tente de novo." };
  }
  const food = typeof pendingFood === "string" && foodByKey(pendingFood) ? pendingFood : undefined;
  return answer(message, { pendingFood: food });
}
