import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";
import { captchaEnabled, captchaSiteKey } from "@/lib/captcha";
import { safeNext } from "@/lib/safe-next";

export const metadata: Metadata = { title: "Entrar" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  return <AuthForm next={safeNext((await searchParams).next)} siteKey={captchaEnabled() ? captchaSiteKey() : ""} />;
}
