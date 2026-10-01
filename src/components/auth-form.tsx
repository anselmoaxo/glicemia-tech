"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Recaptcha, type RecaptchaHandle } from "@/components/recaptcha";
import { TwoFactorChallenge } from "@/components/two-factor-challenge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { CAPTCHA_REQUIRED, loginErrorMessage } from "@/lib/auth-errors";
import { CAPTCHA_HEADER } from "@/lib/captcha";
import { signInSchema } from "@/lib/validation";

/** Formulário de entrada. O cadastro é o passo a passo em signup-wizard.tsx. */
export function AuthForm({ next = "/inicio", siteKey = "" }: { next?: string; siteKey?: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [methods, setMethods] = useState<string[] | null>(null); // preenchido quando falta a segunda etapa
  const captcha = useRef<RecaptchaHandle>(null);
  const signupHref = `/cadastro${next !== "/inicio" ? `?next=${encodeURIComponent(next)}` : ""}`;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const parsed = signInSchema.safeParse(Object.fromEntries(new FormData(e.currentTarget)));
    if (!parsed.success) return setError(parsed.error.issues[0].message);
    if (siteKey && !token) return setError(CAPTCHA_REQUIRED);

    setPending(true);
    // callbackURL é o próprio destino: o Better Auth leva o navegador até ele depois de entrar (e o link de
    // confirmação reenviado também). Qualquer outro endereço aqui desviaria quem entra pelo link de um convite.
    const res = await authClient.signIn.email({ ...parsed.data, callbackURL: next }, {
      headers: siteKey && token ? { [CAPTCHA_HEADER]: token } : undefined,
    });
    setPending(false);

    if (res.error) {
      captcha.current?.reset(); // o token do captcha vale uma vez só
      return setError(loginErrorMessage(res.error));
    }
    const data = res.data as { twoFactorRedirect?: boolean; twoFactorMethods?: string[] } | null;
    if (data?.twoFactorRedirect) {
      setMethods(data.twoFactorMethods?.length ? data.twoFactorMethods : ["totp"]);
      return; // senha certa, mas falta o código da segunda etapa
    }
    router.replace(next);
    router.refresh();
  }

  if (methods) {
    return <TwoFactorChallenge methods={methods} next={next} onBack={() => setMethods(null)} />;
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
      <div className="flex flex-col gap-2">
        <Label htmlFor="email" className="text-base">E-mail</Label>
        <Input id="email" name="email" type="email" autoComplete="email" className="h-12 text-base" required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="password" className="text-base">Senha</Label>
        <PasswordInput id="password" name="password" autoComplete="current-password" className="h-12 text-base" required />
      </div>
      <Link href="/esqueci-senha" className="-mt-2 flex min-h-12 items-center text-base font-semibold underline underline-offset-4">
        Esqueci minha senha
      </Link>
      {siteKey && <Recaptcha ref={captcha} siteKey={siteKey} onChange={setToken} />}
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
