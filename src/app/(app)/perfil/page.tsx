import type { Metadata } from "next";
import { ChangePasswordForm } from "@/components/change-password-form";
import { TwoFactorSettings } from "@/components/two-factor-settings";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { ProfileForm } from "@/components/profile-form";
import { formatPhoneDisplay } from "@/lib/phone";
import { diagnosisYearToYears } from "@/lib/profile-utils";
import { getProfile } from "@/lib/profile";
import { db } from "@/db";
import { profilePhotos, twoFactors } from "@/db/schema";
import { PhotoForm } from "@/components/photo-form";
import Link from "next/link";
import { emailEnabled } from "@/lib/email-flags";
import { requireUser } from "@/lib/session";
import { and, eq } from "drizzle-orm";
import { deleteAccount } from "./actions";

export const metadata: Metadata = { title: "Perfil" };

export default async function PerfilPage({ searchParams }: PageProps<"/perfil">) {
  const user = await requireUser();
  const profile = await getProfile(user.id);
  // aplicativo autenticador já configurado e confirmado?
  const [totp] = await db
    .select({ id: twoFactors.id })
    .from(twoFactors)
    .where(and(eq(twoFactors.userId, user.id), eq(twoFactors.verified, true)));
  const [photo] = await db.select({ at: profilePhotos.updatedAt }).from(profilePhotos).where(eq(profilePhotos.userId, user.id));
  const { exige2fa } = await searchParams;
  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold">Meu perfil</h1>
      {exige2fa && (
        <p role="alert" className="rounded-2xl border border-high/30 bg-high-soft p-4 text-base font-medium text-high">
          A área administrativa exige a verificação em duas etapas. Ative-a abaixo para continuar.
        </p>
      )}
      <PhotoForm userId={user.id} hasPhoto={photo ? 1 : null} version={photo?.at.getTime() ?? 0} />
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
        trackingPurpose={profile.trackingPurpose}
      />

      <nav aria-label="Mais opções do perfil" className="flex flex-col gap-2 text-base font-semibold">
        <Link href="/perfil/profissional" className="underline">Perfil profissional (profissionais de saúde)</Link>
        <Link href="/privacidade" className="underline">Privacidade, exportar meus dados e solicitações</Link>
      </nav>

      <ChangePasswordForm />

      <TwoFactorSettings enabled={Boolean(user.twoFactorEnabled)} hasTotp={Boolean(totp)} emailAvailable={emailEnabled()} />

      <form action={deleteAccount} className="flex flex-col gap-2 border-t pt-6">
        <h2 className="text-xl font-semibold">Excluir conta</h2>
        <p className="text-base text-muted-foreground">Apaga definitivamente sua conta e todos os seus registros.</p>
        <ConfirmDeleteButton label="Excluir minha conta e meus dados" message="Excluir sua conta e TODOS os seus dados? Essa ação não pode ser desfeita." />
      </form>
    </section>
  );
}
