"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { Recaptcha, type RecaptchaHandle } from "@/components/recaptcha";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { CAPTCHA_REQUIRED, loginErrorMessage } from "@/lib/auth-errors";
import { CAPTCHA_HEADER } from "@/lib/captcha";
import { signUpSchema } from "@/lib/validation";

const emailSchema = signUpSchema.shape.email;

export function ForgotPasswordForm({ siteKey = "" }: { siteKey?: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const captcha = useRef<RecaptchaHandle>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const parsed = emailSchema.safeParse(new FormData(e.currentTarget).get("email"));
    if (!parsed.success) return setError(parsed.error.issues[0].message);
    if (siteKey && !token) return setError(CAPTCHA_REQUIRED);

    setPending(true);
    const res = await authClient.requestPasswordReset(
      { email: parsed.data, redirectTo: "/redefinir-senha" },
      { headers: siteKey && token ? { [CAPTCHA_HEADER]: token } : undefined },
    );
    setPending(false);
    captcha.current?.reset(); // o token do captcha vale uma vez só

    // Só erros de captcha/limite aparecem. A resposta é a mesma exista a conta ou não (não revela cadastros).
    if (res.error && (res.error.status === 429 || res.error.code?.match(/^(MISSING_RESPONSE|VERIFICATION_FAILED|UNKNOWN_ERROR)$/))) {
      return setError(loginErrorMessage(res.error));
    }
    setSent(true);
  }

  if (sent) {
    return (
      <div role="status" className="flex flex-col gap-4">
        <h2 className="text-2xl font-bold">Verifique seu e-mail</h2>
        <p className="text-lg">
          Se existir uma conta com esse e-mail, enviamos um link para criar uma nova senha. Olhe também a caixa de spam.
        </p>
        <p className="text-base text-muted-foreground">O link vale por 1 hora e só pode ser usado uma vez.</p>
        <Link href="/login" className="flex min-h-12 items-center justify-center text-base font-semibold underline underline-offset-4">
          Voltar para entrar
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
      <p className="text-lg text-muted-foreground">Digite o e-mail da sua conta. Enviaremos um link para criar uma nova senha.</p>
      <div className="flex flex-col gap-2">
        <Label htmlFor="email" className="text-base">E-mail</Label>
        <Input id="email" name="email" type="email" autoComplete="email" className="h-12 text-base" required />
      </div>
      {siteKey && <Recaptcha ref={captcha} siteKey={siteKey} onChange={setToken} />}
      {error && <p role="alert" className="text-base font-medium text-destructive">{error}</p>}
      <Button type="submit" disabled={pending} className="h-14 text-lg">
        {pending ? "Enviando..." : "Enviar link"}
      </Button>
      <Link href="/login" className="flex min-h-12 items-center justify-center text-base font-semibold underline underline-offset-4">
        Voltar para entrar
      </Link>
    </form>
  );
}
