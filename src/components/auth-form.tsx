"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { recordConsent } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { signInSchema, signUpSchema } from "@/lib/validation";

export function AuthForm({ mode, next = "/inicio" }: { mode: "login" | "cadastro"; next?: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const isLogin = mode === "login";
  const other = `${isLogin ? "/cadastro" : "/login"}${next !== "/inicio" ? `?next=${encodeURIComponent(next)}` : ""}`;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const raw = Object.fromEntries(form);
    const parsed = isLogin ? signInSchema.safeParse(raw) : signUpSchema.safeParse(raw);
    if (!parsed.success) return setError(parsed.error.issues[0].message);
    if (!isLogin && form.get("consent") !== "on") {
      return setError("É necessário aceitar o uso dos seus dados para criar a conta.");
    }

    setPending(true);
    const res = isLogin
      ? await authClient.signIn.email(signInSchema.parse(raw))
      : await authClient.signUp.email(signUpSchema.parse(raw));

    if (res.error) {
      setPending(false);
      return setError(
        isLogin ? "E-mail ou senha incorretos." : "Não foi possível criar a conta. Verifique os dados.",
      );
    }
    if (!isLogin) await recordConsent();
    setPending(false);
    router.replace(next);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
      {!isLogin && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="name" className="text-base">Nome</Label>
          <Input id="name" name="name" autoComplete="name" className="h-12 text-base" required />
        </div>
      )}
      <div className="flex flex-col gap-2">
        <Label htmlFor="email" className="text-base">E-mail</Label>
        <Input id="email" name="email" type="email" autoComplete="email" className="h-12 text-base" required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="password" className="text-base">Senha</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete={isLogin ? "current-password" : "new-password"}
          className="h-12 text-base"
          required
        />
      </div>
      {!isLogin && (
        <label className="flex items-start gap-3 text-base">
          <input type="checkbox" name="consent" className="mt-1 size-6 shrink-0" />
          <span>
            Concordo com o tratamento dos meus dados de saúde para o funcionamento do app, conforme a LGPD.
            Posso excluir minha conta e meus dados a qualquer momento no Perfil.
          </span>
        </label>
      )}
      {error && <p role="alert" className="text-base font-medium text-destructive">{error}</p>}
      <Button type="submit" disabled={pending} className="h-14 text-lg">
        {pending ? "Aguarde..." : isLogin ? "Entrar" : "Criar conta"}
      </Button>
      <p className="text-center text-base">
        {isLogin ? "Ainda não tem conta? " : "Já tem conta? "}
        <Link href={other} className="font-semibold underline underline-offset-4">
          {isLogin ? "Criar conta" : "Entrar"}
        </Link>
      </p>
    </form>
  );
}
