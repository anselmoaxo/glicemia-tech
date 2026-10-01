"use client";

import { Check } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

export function ResetPasswordForm({ token }: { token: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const data = new FormData(e.currentTarget);
    const next = String(data.get("next") ?? "");
    const confirm = String(data.get("confirm") ?? "");
    if (next.length < 8) return setError("A nova senha deve ter ao menos 8 caracteres.");
    if (next !== confirm) return setError("A confirmação não é igual à nova senha.");

    setPending(true);
    const res = await authClient.resetPassword({ newPassword: next, token });
    setPending(false);
    if (res.error) {
      return setError("Este link é inválido ou já expirou. Peça um novo link para criar a senha.");
    }
    setDone(true);
  }

  if (done) {
    return (
      <div role="status" className="flex flex-col gap-4">
        <p className="flex items-center gap-2 text-2xl font-bold text-ok">
          <Check aria-hidden className="size-7" /> Senha alterada
        </p>
        <p className="text-lg">Agora você já pode entrar com a nova senha. Por segurança, os outros aparelhos foram desconectados.</p>
        <Link href="/login" className="flex min-h-14 items-center justify-center rounded-lg bg-primary text-lg font-bold text-primary-foreground">
          Entrar
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
      <div className="flex flex-col gap-2">
        <Label htmlFor="next" className="text-base">Nova senha (mínimo 8 caracteres)</Label>
        <PasswordInput id="next" name="next" autoComplete="new-password" className="h-12 text-base" required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="confirm" className="text-base">Repita a nova senha</Label>
        <PasswordInput id="confirm" name="confirm" autoComplete="new-password" className="h-12 text-base" required />
      </div>
      {error && (
        <div role="alert" className="flex flex-col gap-2">
          <p className="text-base font-medium text-destructive">{error}</p>
          {error.includes("link") && (
            <Link href="/esqueci-senha" className="text-base font-semibold underline underline-offset-4">
              Pedir um novo link
            </Link>
          )}
        </div>
      )}
      <Button type="submit" disabled={pending} className="h-14 text-lg">
        {pending ? "Salvando..." : "Salvar nova senha"}
      </Button>
    </form>
  );
}
