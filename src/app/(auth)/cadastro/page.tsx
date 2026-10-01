import type { Metadata } from "next";
import { SignupWizard } from "@/components/signup-wizard";
import { captchaEnabled, captchaSiteKey } from "@/lib/captcha";
import { emailVerificationRequired } from "@/lib/email-flags";
import { safeNext } from "@/lib/safe-next";
import { redirectIfSignedIn } from "@/lib/signed-in";

export const metadata: Metadata = { title: "Criar conta" };

export default async function CadastroPage({ searchParams }: PageProps<"/cadastro">) {
  const { next } = await searchParams;
  await redirectIfSignedIn(next);
  return (
    <>
      <SignupWizard next={safeNext(next)} siteKey={captchaEnabled() ? captchaSiteKey() : ""} verifyEmail={emailVerificationRequired()} />
      <p className="text-sm text-muted-foreground">
        Este app ajuda a organizar seu acompanhamento. Ele não faz diagnóstico, não sugere doses
        e não substitui o acompanhamento médico.
      </p>
    </>
  );
}
