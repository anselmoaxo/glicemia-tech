import { Check } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirectIfSignedIn } from "@/lib/signed-in";

export const metadata: Metadata = { title: "E-mail confirmado", referrer: "no-referrer", robots: { index: false, follow: false } };

// Destino do link de confirmação. Com sucesso e sessão aberta, o layout leva direto ao app;
// aqui chegam quem não ficou logado e quem abriu um link inválido ou vencido.
export default async function EmailConfirmadoPage({ searchParams }: PageProps<"/email-confirmado">) {
  const { error } = await searchParams;
  await redirectIfSignedIn();

  if (error) {
    return (
      <div className="flex flex-col gap-5">
        <h1 className="text-3xl font-bold tracking-tight">Link inválido</h1>
        <p role="alert" className="text-lg">
          Este link de confirmação é inválido ou já venceu. Entre com seu e-mail e senha: enviaremos um link novo para a sua
          caixa de entrada.
        </p>
        <Link href="/login" className="flex min-h-14 items-center justify-center rounded-lg bg-primary text-lg font-bold text-primary-foreground">
          Ir para entrar
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight text-ok">
        <Check aria-hidden className="size-8" /> E-mail confirmado
      </h1>
      <p className="text-lg">Tudo certo! Agora é só entrar com seu e-mail e senha.</p>
      <Link href="/login" className="flex min-h-14 items-center justify-center rounded-lg bg-primary text-lg font-bold text-primary-foreground">
        Entrar
      </Link>
    </div>
  );
}
