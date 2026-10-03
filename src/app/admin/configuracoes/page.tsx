import { MaxCompanionsForm } from "@/components/max-companions-form";
import { requireAdmin } from "@/lib/admin";
import { CURRENT_PLAN } from "@/lib/plan";
import { getMaxCompanions } from "@/lib/settings";
import { MAX_COMPANIONS_CEILING } from "@/lib/sharing/rules";

export const metadata = { title: "Configurações" };

export default async function ConfiguracoesPage() {
  await requireAdmin();
  const max = await getMaxCompanions();

  return (
    <section className="flex flex-col gap-6">
      <h1 className="font-display text-4xl font-extrabold tracking-tight">Configurações</h1>

      <div className="flex flex-col gap-3 rounded-2xl border bg-card p-4">
        <h2 className="text-xl font-semibold">Acompanhantes por perfil</h2>
        <p className="text-base text-muted-foreground">
          Quantas pessoas (acompanhantes e responsáveis, contando convites pendentes) podem ter acesso a cada perfil. Vale para
          convites novos: quem já tem acesso não perde. A confirmação de um responsável legal nunca é bloqueada pelo limite.
        </p>
        <MaxCompanionsForm current={max} ceiling={MAX_COMPANIONS_CEILING} />
      </div>

      <div className="flex flex-col gap-2 rounded-2xl border bg-card p-4">
        <h2 className="text-xl font-semibold">Plano</h2>
        <p className="text-base">
          {CURRENT_PLAN.label}: todas as funções liberadas, sem cobrança, assinatura ou integração de pagamento.
        </p>
      </div>
    </section>
  );
}
