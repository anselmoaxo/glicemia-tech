import type { Metadata } from "next";
import Link from "next/link";
import { ResetPasswordForm } from "@/components/reset-password-form";
import { redirectIfSignedIn } from "@/lib/signed-in";

// O link do e-mail traz o token na URL: não deve vazar para outros sites nem ficar em cache.
export const metadata: Metadata = { title: "Nova senha", referrer: "no-referrer", robots: { index: false, follow: false } };

export default async function RedefinirSenhaPage({ searchParams }: PageProps<"/redefinir-senha">) {
  const { token, error } = await searchParams;
  await redirectIfSignedIn();
  const valid = typeof token === "string" && token.length > 0 && token.length <= 200 && !error;

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-3xl font-bold tracking-tight">Criar nova senha</h1>
      {valid ? (
        <ResetPasswordForm token={token} />
      ) : (
        <>
          <p role="alert" className="text-lg">Este link é inválido ou já expirou.</p>
          <Link href="/esqueci-senha" className="flex min-h-14 items-center justify-center rounded-lg bg-primary text-lg font-bold text-primary-foreground">
            Pedir um novo link
          </Link>
        </>
      )}
    </div>
  );
}
