import type { Metadata } from "next";
import Link from "next/link";
import { ForgotPasswordForm } from "@/components/forgot-password-form";
import { captchaEnabled, captchaSiteKey } from "@/lib/captcha";
import { emailEnabled } from "@/lib/email-flags";
import { redirectIfSignedIn } from "@/lib/signed-in";

export const metadata: Metadata = { title: "Esqueci minha senha" };

export default async function EsqueciSenhaPage() {
  await redirectIfSignedIn();
  return (
    <div className="flex flex-col gap-5">
      <h1 className="font-display text-4xl font-extrabold tracking-tight">Esqueci minha senha</h1>
      {emailEnabled() ? (
        <ForgotPasswordForm siteKey={captchaEnabled() ? captchaSiteKey() : ""} />
      ) : (
        <>
          <p className="text-lg">
            A recuperação de senha por e-mail ainda não está disponível neste ambiente. Fale com o administrador do app
            para receber ajuda.
          </p>
          <Link href="/login" className="flex min-h-12 items-center text-base font-semibold underline underline-offset-4">
            Voltar para entrar
          </Link>
        </>
      )}
    </div>
  );
}
