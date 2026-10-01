import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { ProfessionalForm } from "@/components/professional-form";
import { db } from "@/db";
import { professionalProfiles } from "@/db/schema";
import { VERIFICATION_LABEL } from "@/lib/privacy/professional";
import { requireUser } from "@/lib/session";
import { removeProfessionalProfile } from "./actions";

export const metadata: Metadata = { title: "Perfil profissional" };

export default async function ProfissionalPage() {
  const user = await requireUser();
  const [pro] = await db.select().from(professionalProfiles).where(eq(professionalProfiles.userId, user.id));
  const status = (pro?.verificationStatus ?? "unverified") as keyof typeof VERIFICATION_LABEL;
  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold">Perfil profissional</h1>
      <div className="flex flex-col gap-2 rounded-2xl border bg-card p-4 text-base">
        <p className="font-semibold">Leia antes de preencher</p>
        <ul className="list-disc pl-6">
          <li>Este perfil <strong>não dá acesso a dados de nenhum usuário</strong>.</li>
          <li>Você só vê dados de uma pessoa se ela (ou o responsável) enviar um convite e você aceitar. Quem convidou pode revisar e revogar o acesso quando quiser.</li>
          <li>O selo &ldquo;Registro verificado&rdquo; só aparece depois que um administrador confere o registro no portal oficial do conselho.</li>
          <li>A foto é a mesma do seu perfil, em &ldquo;Meu perfil&rdquo;.</li>
        </ul>
      </div>
      {pro && (
        <p
          className={`rounded-2xl border p-3 text-base font-medium ${
            status === "verified" ? "border-ok/30 text-ok" : "border-high/30 bg-high-soft text-high"
          }`}
        >
          Situação: {VERIFICATION_LABEL[status]}
        </p>
      )}
      <ProfessionalForm
        profession={pro?.profession ?? ""}
        council={pro?.registryCouncil ?? ""}
        uf={pro?.registryUf ?? ""}
        registryNumber={pro?.registryNumber ?? ""}
        bio={pro?.bio ?? ""}
      />
      {pro && (
        <form action={removeProfessionalProfile} className="border-t pt-6">
          <ConfirmDeleteButton label="Remover perfil profissional" message="Remover seu perfil profissional?" />
        </form>
      )}
    </section>
  );
}
