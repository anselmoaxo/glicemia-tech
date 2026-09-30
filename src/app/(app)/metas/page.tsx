import type { Metadata } from "next";
import { TargetsForm } from "@/components/targets-form";
import { getTargets } from "@/lib/glucose/queries";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Metas" };

export default async function MetasPage() {
  const user = await requireUser();
  const targets = await getTargets(user.id);
  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold">Minhas metas</h1>
      <p className="text-base text-muted-foreground">
        Defina as faixas (em mg/dL) combinadas com seu médico. O app não sugere metas: apenas destaca
        os valores que ficarem fora das faixas que você configurar. Deixe em branco para não usar.
      </p>
      <TargetsForm targets={targets} />
    </section>
  );
}
