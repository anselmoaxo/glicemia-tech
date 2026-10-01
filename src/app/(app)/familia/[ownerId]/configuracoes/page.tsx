import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TrackingScreen } from "@/components/tracking-screen";
import { requireUser } from "@/lib/session";
import { getOwnerName } from "@/lib/sharing/queries";
import { canManagePlan } from "@/lib/tracking/plan";

export const metadata: Metadata = { title: "Configurações do acompanhado", robots: { index: false } };

// Só o responsável legal confirmado de um menor chega aqui. Familiar comum e administrador recebem 404.
export default async function ConfiguracoesDoFilhoPage({ params }: PageProps<"/familia/[ownerId]/configuracoes">) {
  const viewer = await requireUser();
  const { ownerId } = await params;
  if (!ownerId || ownerId.length > 64 || !(await canManagePlan(viewer.id, ownerId)) || ownerId === viewer.id) notFound();

  return (
    <section className="flex flex-col gap-6">
      <Link href={`/familia/${encodeURIComponent(ownerId)}`} className="flex min-h-12 items-center text-base underline underline-offset-4">
        ← Voltar ao acompanhamento
      </Link>
      <h1 className="text-3xl font-bold">Configurações de {await getOwnerName(ownerId)}</h1>
      <p className="rounded-2xl border bg-card p-4 text-base">
        Você está configurando como responsável legal. As alterações ficam registradas e visíveis para a pessoa acompanhada.
      </p>
      <TrackingScreen ownerId={ownerId} forGuardian />
    </section>
  );
}
