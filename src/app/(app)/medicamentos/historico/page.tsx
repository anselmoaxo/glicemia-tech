import type { Metadata } from "next";
import Link from "next/link";
import { formatDateTime } from "@/lib/datetime";
import { listLogs } from "@/lib/medications/queries";
import { getProfile } from "@/lib/profile";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Histórico de medicamentos" };

export default async function HistoricoMedicamentosPage({
  searchParams,
}: PageProps<"/medicamentos/historico">) {
  const user = await requireUser();
  const { pagina } = await searchParams;
  const page = Math.max(1, Number.parseInt(String(pagina ?? "1"), 10) || 1);
  const [{ items, hasMore }, { timezone }] = await Promise.all([listLogs(user.id, page), getProfile(user.id)]);

  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold">Histórico de medicamentos</h1>

      {items.length === 0 ? (
        <p className="text-base text-muted-foreground">Nenhum registro ainda.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((l) => (
            <li key={l.id} className="flex items-center justify-between gap-3 rounded-xl border p-4">
              <div>
                <p className="text-lg font-semibold">{l.name}</p>
                <p className="text-base text-muted-foreground">
                  {formatDateTime(l.scheduledFor, timezone)} · {l.dose} {l.unit}
                </p>
              </div>
              <span
                className={`rounded-full border-2 px-3 py-1 text-sm font-semibold ${
                  l.status === "taken" ? "border-green-700 bg-green-50 text-green-900" : "border-border bg-muted"
                }`}
              >
                {l.status === "taken" ? "Tomei" : "Não tomei"}
              </span>
            </li>
          ))}
        </ul>
      )}

      <nav aria-label="Paginação" className="flex justify-between gap-3">
        {page > 1 ? (
          <Link href={`/medicamentos/historico?pagina=${page - 1}`} className="flex min-h-12 items-center px-3 text-base underline underline-offset-4">
            ← Mais recentes
          </Link>
        ) : (
          <span />
        )}
        {hasMore && (
          <Link href={`/medicamentos/historico?pagina=${page + 1}`} className="flex min-h-12 items-center px-3 text-base underline underline-offset-4">
            Mais antigos →
          </Link>
        )}
      </nav>
      <Link href="/medicamentos" className="flex min-h-12 items-center text-base underline underline-offset-4">
        Voltar
      </Link>
    </section>
  );
}
