import { requireAdmin } from "@/lib/admin";
import { CURRENT_PLAN } from "@/lib/plan";

export const metadata = { title: "Configurações" };

export default async function ConfiguracoesPage() {
  await requireAdmin();

  return (
    <section className="flex flex-col gap-6">
      <h1 className="font-display text-4xl font-extrabold tracking-tight">Configurações</h1>

      <div className="flex flex-col gap-2 rounded-2xl border bg-card p-4">
        <h2 className="text-xl font-semibold">Plano</h2>
        <p className="text-base">
          {CURRENT_PLAN.label}: todas as funções liberadas, sem cobrança, assinatura ou integração de pagamento.
        </p>
      </div>
    </section>
  );
}
