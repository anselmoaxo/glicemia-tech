"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

export function ChangePasswordForm() {
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const current = String(data.get("current") ?? "");
    const next = String(data.get("next") ?? "");
    const confirm = String(data.get("confirm") ?? "");

    if (next.length < 8) return setMessage({ ok: false, text: "A nova senha deve ter ao menos 8 caracteres." });
    if (next !== confirm) return setMessage({ ok: false, text: "A confirmação não é igual à nova senha." });

    setPending(true);
    const res = await authClient.changePassword({
      currentPassword: current,
      newPassword: next,
      revokeOtherSessions: true,
    });
    setPending(false);

    if (res.error) return setMessage({ ok: false, text: "Não foi possível alterar. Confira a senha atual." });
    form.reset();
    setMessage({ ok: true, text: "Senha alterada. Outros aparelhos foram desconectados." });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4 border-t pt-6">
      <h2 className="text-xl font-semibold">Alterar senha</h2>
      <div className="flex flex-col gap-2">
        <Label htmlFor="current" className="text-base">Senha atual</Label>
        <Input id="current" name="current" type="password" autoComplete="current-password" required className="h-12 text-base" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="next" className="text-base">Nova senha (mínimo 8 caracteres)</Label>
        <Input id="next" name="next" type="password" autoComplete="new-password" required className="h-12 text-base" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="confirm" className="text-base">Repita a nova senha</Label>
        <Input id="confirm" name="confirm" type="password" autoComplete="new-password" required className="h-12 text-base" />
      </div>
      {message && (
        <p role={message.ok ? "status" : "alert"} className={`text-base font-medium ${message.ok ? "" : "text-destructive"}`}>
          {message.text}
        </p>
      )}
      <Button type="submit" disabled={pending} className="h-14 text-lg">
        {pending ? "Alterando..." : "Alterar senha"}
      </Button>
    </form>
  );
}
