"use client";

import { Bot, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AssistantChat } from "@/components/assistant-chat";

/**
 * Botão flutuante do assistente, presente em todas as telas do app (inclusive a administração).
 * Mostra o robô com o balão "Posso ajudar?" e abre o chat num painel, sem sair da tela atual.
 */
export function AssistantWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const openerRef = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);

  useEffect(() => {
    if (!open) {
      // ao fechar, devolve o foco ao botão que abriu o painel
      if (wasOpen.current) openerRef.current?.focus();
      return;
    }
    wasOpen.current = true;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // A página do assistente já é o chat completo.
  if (pathname.startsWith("/assistente")) return null;

  return (
    <>
      {!open && (
        <button
          ref={openerRef}
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Abrir o assistente: posso ajudar?"
          aria-haspopup="dialog"
          className="fixed bottom-24 right-4 z-40 flex items-center gap-2 md:bottom-24 md:right-6"
        >
          <span className="relative max-w-[9rem] rounded-2xl rounded-br-sm border bg-card px-3 py-2 text-sm font-semibold shadow-md">
            Posso ajudar?
          </span>
          <span className="grid size-14 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg ring-4 ring-background">
            <Bot aria-hidden className="size-7" />
          </span>
        </button>
      )}

      {open && (
        <div
          role="dialog"
          aria-modal="false"
          aria-label="Assistente educativo"
          className="fixed inset-x-2 bottom-2 z-50 flex max-h-[85dvh] flex-col rounded-3xl border bg-card shadow-2xl sm:inset-x-auto sm:bottom-24 sm:right-6 sm:w-[26rem] md:max-h-[calc(100dvh-8rem)]"
        >
          <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
            <p className="flex items-center gap-2 text-lg font-bold">
              <span aria-hidden className="grid size-9 place-items-center rounded-full bg-primary text-primary-foreground">
                <Bot className="size-5" />
              </span>
              Assistente
            </p>
            <button
              ref={closeRef}
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Fechar o assistente"
              className="grid size-11 place-items-center rounded-full hover:bg-secondary"
            >
              <X aria-hidden className="size-5" />
            </button>
          </div>
          <div className="overflow-y-auto p-4">
            <p className="mb-3 text-sm text-muted-foreground">
              Conteúdo educativo sobre diabetes, glicose e carboidratos. Não substitui profissional de saúde nem indica doses.
              Urgência: procure atendimento (SAMU 192).
            </p>
            <AssistantChat />
          </div>
        </div>
      )}
    </>
  );
}
