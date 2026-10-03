import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SharingManager } from "@/components/sharing-manager";
import { Button } from "@/components/ui/button";
import { getProfile } from "@/lib/profile";
import { requireUser } from "@/lib/session";
import { getSharingContext } from "@/lib/sharing/manage";
import { listFamilyMembers } from "@/lib/sharing/queries";
import { majorityStatus } from "@/lib/sharing/rules";
import { confirmMajorityReview } from "./actions";

export const metadata: Metadata = { title: "Compartilhar" };

export default async function CompartilharPage() {
  const user = await requireUser();
  const [ctx, profile, members] = await Promise.all([getSharingContext(user.id, user.id), getProfile(user.id), listFamilyMembers(user.id)]);
  if (!ctx) notFound();

  // Completou 18 anos e ainda há um responsável com acesso: a pessoa revisa e decide quem continua.
  const hasGuardian = members.some((m) => m.role === "guardian" && m.status === "accepted");
  const needsMajorityReview = majorityStatus(profile.birthDate).kind === "adult" && hasGuardian && !profile.majorityReviewedAt;

  return (
    <section className="flex flex-col gap-8">
      <h1 className="text-3xl font-bold">Compartilhar com familiares</h1>
      {needsMajorityReview && (
        <form action={confirmMajorityReview} className="flex flex-col gap-3 rounded-2xl border-2 border-primary bg-card p-4 text-base">
          <h2 className="text-xl font-semibold">Você completou 18 anos</h2>
          <p>
            Agora é você quem controla o seu perfil. Seu antigo responsável continua vendo seus registros até você decidir.
            Revise a lista abaixo: revogue quem não deve mais ter acesso e confirme quando terminar.
          </p>
          <Button type="submit" className="h-12 text-base">Revisei quem tem acesso</Button>
        </form>
      )}
      <SharingManager ownerId={user.id} ctx={ctx} />
    </section>
  );
}
