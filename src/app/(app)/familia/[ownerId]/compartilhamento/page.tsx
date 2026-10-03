import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SharingManager } from "@/components/sharing-manager";
import { requireUser } from "@/lib/session";
import { getSharingContext } from "@/lib/sharing/manage";

export const metadata: Metadata = { title: "Compartilhamento do menor", robots: { index: false } };

// Só o responsável legal ativo de um menor gerencia aqui; qualquer outra pessoa recebe 404.
export default async function CompartilhamentoDoMenorPage({ params }: PageProps<"/familia/[ownerId]/compartilhamento">) {
  const viewer = await requireUser();
  const { ownerId } = await params;
  if (!ownerId || ownerId.length > 64 || ownerId === viewer.id) notFound();
  const ctx = await getSharingContext(viewer.id, ownerId);
  if (!ctx || ctx.actor !== "guardian") notFound();

  return (
    <section className="flex flex-col gap-6">
      <Link href={`/familia/${encodeURIComponent(ownerId)}`} className="flex min-h-12 items-center text-base underline underline-offset-4">
        ← Voltar ao acompanhamento
      </Link>
      <h1 className="text-3xl font-bold">Quem acompanha {ctx.owner.name}</h1>
      <p className="rounded-2xl border bg-card p-4 text-base">
        Como responsável legal, você decide quem mais pode ver os registros de {ctx.owner.name} e o que cada pessoa vê. As
        mudanças ficam no histórico e aparecem também para {ctx.owner.name}.
      </p>
      <SharingManager ownerId={ownerId} ctx={ctx} />
    </section>
  );
}
