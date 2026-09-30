import type { Metadata } from "next";
import { SignupWizard } from "@/components/signup-wizard";
import { safeNext } from "@/lib/safe-next";

export const metadata: Metadata = { title: "Criar conta" };

export default async function CadastroPage({ searchParams }: PageProps<"/cadastro">) {
  return (
    <>
      <SignupWizard next={safeNext((await searchParams).next)} />
      <p className="text-sm text-muted-foreground">
        Este app ajuda a organizar seu acompanhamento. Ele não faz diagnóstico, não sugere doses
        e não substitui o acompanhamento médico.
      </p>
    </>
  );
}
