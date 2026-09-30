import type { Metadata } from "next";
import Link from "next/link";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { formatDateTime } from "@/lib/datetime";
import { formatUnits, relationLabel, siteLabel } from "@/lib/insulin/options";
import { listInsulinLogs } from "@/lib/insulin/queries";
import { getProfile } from "@/lib/profile";
import { requireUser } from "@/lib/session";
import { deleteInsulinLog } from "./actions";

export const metadata: Metadata = { title: "Insulina" };

export default async function InsulinaPage({ searchParams }: PageProps<"/insulina">) {
  const user = await requireUser();
  const { pagina } = await searchParams;
  const page = Math.max(1, Number.parseInt(String(pagina ?? "1"), 10) || 1);
  const [{ items, hasMore }, { timezone }] = await Promise.all([
    listInsulinLogs(user.id, page),
    getProfile(user.id),
  ]);

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">Insulina</h1>
        <Link
          href="/insulina/nova"
          className="flex min-h-14 items-center rounded-lg bg-primary px-5 text-lg font-semibold text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          Registrar insulina
        </Link>
      </div>

      {items.length === 0 ? (
        <p className="text-base text-muted-foreground">
          {page > 1 ? "Não há mais registros." : "Você ainda não registrou nenhuma aplicação."}
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {items.map((l) => (
            <li key={l.id} className="flex flex-col gap-3 rounded-2xl border bg-card p-4">
              <p className="text-3xl font-bold">
                {formatUnits(l.units)}{" "}
                <span className="text-base font-normal text-muted-foreground">unidades · {l.typeName}</span>
              </p>
              <p className="text-base">
                {formatDateTime(l.appliedAt, timezone)} · {relationLabel(l.mealRelation)}
                {siteLabel(l.site) && ` · ${siteLabel(l.site)}`}
              </p>
              {l.notes && <p className="text-base text-muted-foreground">{l.notes}</p>}
              <div className="flex gap-3">
                <Link
                  href={`/insulina/${l.id}/editar`}
                  className="flex min-h-12 flex-1 items-center justify-center rounded-lg border-2 text-base font-medium focus-visible:outline-2 focus-visible:outline-ring"
                >
                  Editar
                </Link>
                <form action={deleteInsulinLog} className="flex-1">
                  <input type="hidden" name="id" value={l.id} />
                  <ConfirmDeleteButton />
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}

      <nav aria-label="Paginação" className="flex justify-between gap-3">
        {page > 1 ? (
          <Link href={`/insulina?pagina=${page - 1}`} className="flex min-h-12 items-center px-3 text-base underline underline-offset-4">
            ← Mais recentes
          </Link>
        ) : (
          <span />
        )}
        {hasMore && (
          <Link href={`/insulina?pagina=${page + 1}`} className="flex min-h-12 items-center px-3 text-base underline underline-offset-4">
            Mais antigos →
          </Link>
        )}
      </nav>
    </section>
  );
}
