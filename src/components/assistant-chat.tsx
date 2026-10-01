"use client";

import { useRef, useState, useTransition } from "react";
import { askAssistant } from "@/app/(app)/assistente/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Msg = { from: "me" | "bot"; text: string; urgent?: boolean };

const SUGGESTIONS = ["O que é hemoglobina glicada?", "Quantos carboidratos tem 2 pães franceses?", "Como ler o rótulo de um alimento?"];

export function AssistantChat() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [pending, startTransition] = useTransition();
  const pendingFood = useRef<string | undefined>(undefined);
  const [text, setText] = useState("");

  function send(raw: string) {
    const message = raw.trim();
    if (!message || pending) return;
    setMessages((m) => [...m, { from: "me", text: message }]);
    setText("");
    startTransition(async () => {
      const reply = await askAssistant(message, pendingFood.current);
      pendingFood.current = reply.pendingFood;
      setMessages((m) => [...m, { from: "bot", text: reply.text, urgent: reply.kind === "emergency" }]);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div role="log" aria-live="polite" aria-label="Conversa com o assistente" className="flex min-h-48 flex-col gap-3">
        {messages.length === 0 && (
          <ul className="flex flex-col gap-2">
            {SUGGESTIONS.map((s) => (
              <li key={s}>
                <button type="button" onClick={() => send(s)} className="min-h-12 w-full rounded-2xl border-2 px-4 text-left text-base focus-visible:outline-2 focus-visible:outline-ring">
                  {s}
                </button>
              </li>
            ))}
          </ul>
        )}
        {messages.map((m, i) => (
          <p
            key={i}
            className={`whitespace-pre-line rounded-2xl p-4 text-base ${
              m.from === "me" ? "self-end bg-primary text-primary-foreground" : m.urgent ? "border-2 border-high bg-high-soft font-semibold text-high" : "border bg-card"
            }`}
          >
            <span className="sr-only">{m.from === "me" ? "Você: " : "Assistente: "}</span>
            {m.text}
          </p>
        ))}
        {pending && <p role="status" className="text-base text-muted-foreground">Respondendo...</p>}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(text);
        }}
        className="flex flex-col gap-2"
      >
        <Label htmlFor="pergunta" className="text-base">Sua pergunta</Label>
        <Input id="pergunta" value={text} onChange={(e) => setText(e.target.value)} maxLength={500} autoComplete="off" className="h-12 text-base" />
        <Button type="submit" disabled={pending || !text.trim()} className="h-14 text-lg">Enviar</Button>
      </form>
    </div>
  );
}
