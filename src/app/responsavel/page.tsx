import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { GuardianForm } from "@/components/guardian-form";
import { ageFromBirthDate } from "@/lib/profile-utils";
import { getProfile } from "@/lib/profile";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Confirmação do responsável", robots: { index: false } };

// Fica fora do grupo (app): o layout do app envia menores sem confirmação para cá.
export default async function ResponsavelPage() {
  const user = await requireUser();
  const profile = await getProfile(user.id);
  const age = ageFromBirthDate(profile.birthDate);
  if (age === null || age >= 18 || profile.guardianConsentAt) redirect("/inicio");

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 px-4 py-10">
      <h1 className="text-3xl font-bold">Falta a confirmação do responsável</h1>
      <p className="text-base">
        Pela sua data de nascimento, você tem menos de 18 anos. Para usar o Glicose Tech, um pai, mãe ou responsável legal
        precisa confirmar. Informe o e-mail dele(a): enviaremos um link, e a pessoa precisa entrar com uma conta própria
        usando esse e-mail. Depois disso, ela passa a acompanhar seus registros (somente leitura).
      </p>
      <GuardianForm />
      <p className="text-sm text-muted-foreground">
        Se a data de nascimento estiver errada, o responsável pode pedir a correção ao suporte do Glicose Tech.
      </p>
    </main>
  );
}
