import type { Metadata } from "next";
import { desc, eq } from "drizzle-orm";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { ShareReportForm } from "@/components/share-report-form";
import { db } from "@/db";
import { sharedReports } from "@/db/schema";
import { formatDateTime } from "@/lib/datetime";
import { getProfile } from "@/lib/profile";
import { REPORT_PERIODS } from "@/lib/reports/range";
import { requireUser } from "@/lib/session";
import { isActive } from "@/lib/sharing/tokens";
import { revokeSharedReport } from "./actions";

export const metadata: Metadata = { title: "Relatórios" };

const br = (iso: string) => iso.split("-").reverse().join("/");

export default async function RelatoriosPage() {
  const user = await requireUser();
  const { timezone } = await getProfile(user.id);
  const links = await db
    .select()
    .from(sharedReports)
    .where(eq(sharedReports.userId, user.id))
    .orderBy(desc(sharedReports.createdAt))
    .limit(20);

  return (
    <section className="flex flex-col gap-8">
      <h1 className="text-3xl font-bold">Relatórios</h1>

      <div className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold">Baixar PDF</h2>
        <div className="grid grid-cols-2 gap-3">
          {REPORT_PERIODS.map((d) => (
            <a
              key={d}
              href={`/api/relatorio?dias=${d}`}
              className="flex min-h-14 items-center justify-center rounded-lg border-2 border-primary text-base font-semibold focus-visible:outline-2 focus-visible:outline-ring"
            >
              {d} dias
            </a>
          ))}
        </div>
        <form action="/api/relatorio" method="get" className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-2">
            <label htmlFor="from" className="text-base">De</label>
            <input id="from" name="from" type="date" required className="h-12 rounded-lg border border-input bg-background px-3 text-base" />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="to" className="text-base">Até</label>
            <input id="to" name="to" type="date" required className="h-12 rounded-lg border border-input bg-background px-3 text-base" />
          </div>
          <button className="col-span-2 min-h-14 rounded-lg border-2 text-base font-semibold focus-visible:outline-2 focus-visible:outline-ring">
            Baixar intervalo personalizado
          </button>
        </form>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold">Link temporário para o médico</h2>
        <p className="text-base text-muted-foreground">
          Somente leitura, sem necessidade de conta, com validade definida. Você pode revogar a qualquer momento.
        </p>
        <ShareReportForm />
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold">Links criados</h2>
        {links.length === 0 && <p className="text-base text-muted-foreground">Nenhum link ainda.</p>}
        <ul className="flex flex-col gap-3">
          {links.map((l) => {
            const active = isActive({ expiresAt: l.expiresAt, revokedAt: l.revokedAt });
            return (
              <li key={l.id} className="flex flex-col gap-2 rounded-2xl border bg-card p-4">
                <p className="text-base font-semibold">{br(l.fromDate)} a {br(l.toDate)}</p>
                <p className="text-base">
                  {l.revokedAt ? "Revogado" : active ? `Ativo até ${formatDateTime(l.expiresAt, timezone)}` : "Expirado"}
                </p>
                {active && (
                  <form action={revokeSharedReport}>
                    <input type="hidden" name="id" value={l.id} />
                    <ConfirmDeleteButton label="Revogar link" message="Revogar este link? O médico perderá o acesso." />
                  </form>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
