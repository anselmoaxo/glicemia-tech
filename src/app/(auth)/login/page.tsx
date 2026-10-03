import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";
import { captchaEnabled, captchaSiteKey } from "@/lib/captcha";
import { safeNext } from "@/lib/safe-next";
import { redirectIfSignedIn } from "@/lib/signed-in";

export const metadata: Metadata = { title: "Entrar" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next } = await searchParams;
  await redirectIfSignedIn(next);
  return (
    <>
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-4xl font-extrabold tracking-tight">Entrar</h1>
        <p className="text-lg text-muted-foreground">Use o e-mail e a senha da sua conta.</p>
      </div>
      <AuthForm next={safeNext(next)} siteKey={captchaEnabled() ? captchaSiteKey() : ""} />
    </>
  );
}
