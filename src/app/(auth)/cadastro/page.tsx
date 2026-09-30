import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";
import { safeNext } from "@/lib/safe-next";

export const metadata: Metadata = { title: "Criar conta" };

export default async function CadastroPage({ searchParams }: PageProps<"/cadastro">) {
  return (
    <>
      <AuthForm mode="cadastro" next={safeNext((await searchParams).next)} />
      <p className="text-sm text-muted-foreground">
        Este app ajuda a organizar seu acompanhamento. Ele não faz diagnóstico, não sugere doses
        e não substitui o acompanhamento médico.
      </p>
    </>
  );
}
