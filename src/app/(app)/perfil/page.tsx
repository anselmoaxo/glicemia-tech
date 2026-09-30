import type { Metadata } from "next";
import { ChangePasswordForm } from "@/components/change-password-form";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { ProfileForm } from "@/components/profile-form";
import { formatPhoneDisplay } from "@/lib/phone";
import { diagnosisYearToYears } from "@/lib/profile-utils";
import { getProfile } from "@/lib/profile";
import { requireUser } from "@/lib/session";
import { deleteAccount } from "./actions";

export const metadata: Metadata = { title: "Perfil" };

export default async function PerfilPage() {
  const user = await requireUser();
  const profile = await getProfile(user.id);
  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold">Meu perfil</h1>
      <ProfileForm
        name={user.name}
        email={user.email}
        phone={formatPhoneDisplay(profile.phone)}
        birthDate={profile.birthDate}
        sex={profile.sex}
        diabetesType={profile.diabetesType}
        yearsWithDiabetes={diagnosisYearToYears(profile.diagnosisYear)}
        fontScale={profile.fontScale}
        alertEmailSelf={profile.alertEmailSelf}
        alertEmailFamily={profile.alertEmailFamily}
      />

      <ChangePasswordForm />

      <form action={deleteAccount} className="flex flex-col gap-2 border-t pt-6">
        <h2 className="text-xl font-semibold">Excluir conta</h2>
        <p className="text-base text-muted-foreground">Apaga definitivamente sua conta e todos os seus registros.</p>
        <ConfirmDeleteButton label="Excluir minha conta e meus dados" message="Excluir sua conta e TODOS os seus dados? Essa ação não pode ser desfeita." />
      </form>
    </section>
  );
}
