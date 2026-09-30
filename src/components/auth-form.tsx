"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { signInSchema } from "@/lib/validation";

/** Formulário de entrada. O cadastro é o passo a passo em signup-wizard.tsx. */
export function AuthForm({ next = "/inicio" }: { next?: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const signupHref = `/cadastro${next !== "/inicio" ? `?next=${encodeURIComponent(next)}` : ""}`;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const parsed = signInSchema.safeParse(Object.fromEntries(new FormData(e.currentTarget)));
    if (!parsed.success) return setError(parsed.error.issues[0].message);

    setPending(true);
    const res = await authClient.signIn.email(parsed.data);
    setPending(false);

    if (res.error) {
      return setError("Não foi possível entrar. Confira e-mail e senha; se estiver correto, a conta pode estar suspensa.");
    }
    router.replace(next);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
      <div className="flex flex-col gap-2">
        <Label htmlFor="email" className="text-base">E-mail</Label>
        <Input id="email" name="email" type="email" autoComplete="email" className="h-12 text-base" required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="password" className="text-base">Senha</Label>
        <Input id="password" name="password" type="password" autoComplete="current-password" className="h-12 text-base" required />
      </div>
      {error && <p role="alert" className="text-base font-medium text-destructive">{error}</p>}
      <Button type="submit" disabled={pending} className="h-14 text-lg">
        {pending ? "Aguarde..." : "Entrar"}
      </Button>
      <p className="text-center text-base">
        Ainda não tem conta?{" "}
        <Link href={signupHref} className="font-semibold underline underline-offset-4">
          Criar conta
        </Link>
      </p>
    </form>
  );
}
