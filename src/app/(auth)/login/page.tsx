import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";
import { captchaEnabled, captchaSiteKey } from "@/lib/captcha";
import { safeNext } from "@/lib/safe-next";
import { redirectIfSignedIn } from "@/lib/signed-in";

export const metadata: Metadata = { title: "Entrar" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next } = await searchParams;
  await redirectIfSignedIn(next);
  return <AuthForm next={safeNext(next)} siteKey={captchaEnabled() ? captchaSiteKey() : ""} />;
}
