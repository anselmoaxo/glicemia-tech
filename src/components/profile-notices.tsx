import Link from "next/link";
import { Info } from "lucide-react";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { familyMembers } from "@/db/schema";
import { getProfile } from "@/lib/profile";
import { majorityStatus } from "@/lib/sharing/rules";

const box = "mx-auto mb-4 flex w-full max-w-3xl gap-3 rounded-2xl border bg-secondary p-4 text-base";

/** Avisos do próprio perfil no Início: maioridade chegando ou alcançada, e perfil sem diabetes. */
export async function ProfileNotices({ userId }: { userId: string }) {
  const profile = await getProfile(userId);
  const majority = majorityStatus(profile.birthDate);
  let guardianActive = false;
  if (majority.kind === "adult" && !profile.majorityReviewedAt) {
    const [row] = await db
      .select({ id: familyMembers.id })
      .from(familyMembers)
      .where(and(eq(familyMembers.ownerId, userId), eq(familyMembers.role, "guardian"), eq(familyMembers.status, "accepted")))
      .limit(1);
    guardianActive = Boolean(row);
  }

  return (
    <>
      {majority.kind === "soon" && (
        <p role="note" className={box}>
          <Info aria-hidden className="mt-0.5 size-6 shrink-0 text-primary" />
          <span>
            Faltam {majority.daysTo18} {majority.daysTo18 === 1 ? "dia" : "dias"} para você completar 18 anos. A partir daí você
            controla o seu perfil: o responsável deixa de configurar o acompanhamento e você decide quem continua com acesso aos
            seus dados.
          </span>
        </p>
      )}
      {guardianActive && (
        <p role="note" className={box}>
          <Info aria-hidden className="mt-0.5 size-6 shrink-0 text-primary" />
          <span>
            Você completou 18 anos e agora controla o seu perfil.{" "}
            <Link href="/compartilhar" className="font-semibold underline">Revise quem tem acesso aos seus dados</Link>.
          </span>
        </p>
      )}
      {profile.trackingPurpose === "sem_diabetes" && (
        <p role="note" className={box}>
          <Info aria-hidden className="mt-0.5 size-6 shrink-0 text-primary" />
          <span>
            Seu perfil está como &ldquo;não tenho diabetes&rdquo;. O app só organiza seus registros: não confirma nem descarta
            diagnóstico, nem a partir de uma medição isolada. Dá para mudar isso no <Link href="/perfil" className="underline">Perfil</Link> sem perder o histórico.
          </span>
        </p>
      )}
    </>
  );
}
