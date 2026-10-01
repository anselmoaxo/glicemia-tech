import type { Metadata } from "next";
import Link from "next/link";
import { TrackingScreen } from "@/components/tracking-screen";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Configurações de acompanhamento" };

export default async function AcompanhamentoPage() {
  const user = await requireUser();
  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold">Configurações de acompanhamento</h1>
      <TrackingScreen ownerId={user.id} forGuardian={false} />
      <nav aria-label="Outras configurações" className="flex flex-col gap-2 border-t pt-6 text-base font-semibold">
        <Link href="/acompanhamento/emails" className="underline">Histórico de e-mails enviados</Link>
        <Link href="/acompanhamento/n8n" className="underline">Integração com o n8n</Link>
        <Link href="/alertas" className="underline">Lembretes para medir e faixa pessoal</Link>
        <Link href="/medicamentos" className="underline">Medicamentos e horários</Link>
      </nav>
    </section>
  );
}
