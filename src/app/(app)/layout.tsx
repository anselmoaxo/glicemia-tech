import { AppNav } from "@/components/app-nav";
import { AssistantWidget } from "@/components/assistant-widget";
import { redirect } from "next/navigation";
import { ageFromBirthDate } from "@/lib/profile-utils";
import { getProfile } from "@/lib/profile";
import { requireUser } from "@/lib/session";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await requireUser();
  const profile = await getProfile(user.id);
  // Menor de 18 anos só usa o app depois que um responsável legal confirma por e-mail.
  const age = ageFromBirthDate(profile.birthDate);
  if (age !== null && age < 18 && !profile.guardianConsentAt) redirect("/responsavel");
  return (
    <>
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:rounded-lg focus:bg-background focus:p-3 focus:text-base focus:font-semibold focus:outline-2 focus:outline-ring"
      >
        Pular para o conteúdo
      </a>
      {/* escala de texto (rem) conforme preferência do usuário; inteiro 100–150 validado no banco */}
      <style>{`html{font-size:${profile.fontScale}%}`}</style>
      <AppNav />
      <main id="conteudo" className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 pb-28 md:pb-32">
        {children}
      </main>
      <AssistantWidget />
    </>
  );
}
