import { desc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import { SupportForm } from "@/components/support-form";
import { db } from "@/db";
import { supportRequests } from "@/db/schema";
import { fmtDateTime } from "@/lib/admin-format";
import { kindLabel, STATUS_LABEL } from "@/lib/privacy/support";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Privacidade" };

export default async function PrivacidadePage() {
  const user = await requireUser();
  const requests = await db
    .select()
    .from(supportRequests)
    .where(eq(supportRequests.userId, user.id))
    .orderBy(desc(supportRequests.createdAt))
    .limit(10);

  return (
    <section className="flex flex-col gap-8">
      <h1 className="text-3xl font-bold">Privacidade e meus dados</h1>

      <div className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold">Exportar meus dados</h2>
        <p className="text-base text-muted-foreground">
          Baixe uma cópia dos seus registros (glicemia, refeições, medicamentos, insulina e perfil). Somente os seus dados.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <a href="/api/exportar?formato=json" download className="flex min-h-14 flex-1 items-center justify-center rounded-lg border-2 text-lg font-semibold focus-visible:outline-2 focus-visible:outline-ring">
            Baixar em JSON
          </a>
          <a href="/api/exportar?formato=csv" download className="flex min-h-14 flex-1 items-center justify-center rounded-lg border-2 text-lg font-semibold focus-visible:outline-2 focus-visible:outline-ring">
            Glicemias em CSV
          </a>
        </div>
      </div>

      <div className="flex flex-col gap-2 text-base">
        <h2 className="text-xl font-semibold">Como tratamos seus dados</h2>
        <ul className="list-disc pl-6">
          <li>Só você e os familiares que você convidar enxergam seus registros, e você revoga o acesso quando quiser.</li>
          <li>Os administradores do app veem apenas contagens e dados de conta, nunca suas medições.</li>
          <li>Ao excluir a conta em Perfil, seus dados são apagados definitivamente.</li>
        </ul>
        <p className="text-sm text-muted-foreground">
          Esta página é um resumo técnico. Leia a <a className="underline" href="/politica-de-privacidade">Política de Privacidade</a>.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold">Falar com o suporte ou pedir algo sobre seus dados</h2>
        <SupportForm />
      </div>

      {requests.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold">Minhas solicitações</h2>
          <ul className="flex flex-col gap-2">
            {requests.map((r) => (
              <li key={r.id} className="rounded-2xl border bg-card p-4 text-base">
                <span className="font-semibold">{kindLabel(r.kind)}</span> ·{" "}
                {STATUS_LABEL[r.status as keyof typeof STATUS_LABEL]}
                <span className="block text-muted-foreground">{fmtDateTime(r.createdAt)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
