import { Info } from "lucide-react";
import type { Metadata } from "next";
import { TargetsForm } from "@/components/targets-form";
import { getTargets } from "@/lib/glucose/queries";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Metas" };

export default async function MetasPage() {
  const user = await requireUser();
  const targets = await getTargets(user.id);
  const configured = Object.keys(targets).length;

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Minhas metas</h1>
        <p className="max-w-prose text-lg text-muted-foreground">
          Defina as faixas de glicemia, em mg/dL, combinadas com o seu médico. O app não sugere metas: ele só destaca os
          valores que ficarem fora das faixas que você configurar.
        </p>
      </div>

      {configured === 0 && (
        <p role="note" className="flex gap-3 rounded-2xl bg-secondary p-4 text-base">
          <Info aria-hidden className="mt-0.5 size-6 shrink-0 text-primary" />
          <span>
            Você ainda não definiu nenhuma faixa, então o app não marca nenhuma medição como dentro ou fora da meta.
            Comece pela faixa <strong>Geral</strong>.
          </span>
        </p>
      )}

      <TargetsForm targets={targets} />
    </section>
  );
}
