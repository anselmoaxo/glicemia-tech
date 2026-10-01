import type { Metadata } from "next";
import Link from "next/link";
import { ReadingItem } from "@/components/reading-item";
import { classify } from "@/lib/glucose/classify";
import { getTargets, listReadings } from "@/lib/glucose/queries";
import { getProfile } from "@/lib/profile";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Glicemia" };

export default async function GlicemiaPage({ searchParams }: PageProps<"/glicemia">) {
  const user = await requireUser();
  const { pagina } = await searchParams;
  const page = Math.max(1, Number.parseInt(String(pagina ?? "1"), 10) || 1);

  const [{ items, hasMore }, targets, profile] = await Promise.all([
    listReadings(user.id, page),
    getTargets(user.id),
    getProfile(user.id),
  ]);

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">Glicemia</h1>
        <Link
          href="/glicemia/nova"
          className="flex min-h-14 items-center rounded-lg bg-primary px-5 text-lg font-semibold text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          Registrar glicemia
        </Link>
      </div>

      {items.length === 0 ? (
        <p className="text-base text-muted-foreground">
          {page > 1 ? "Não há mais registros." : "Você ainda não registrou nenhuma medição."}
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {items.map((r) => (
            <ReadingItem
              key={r.id}
              timezone={profile.timezone}
              r={{ ...r, status: classify(r.value, r.contextKey, targets) }}
            />
          ))}
        </ul>
      )}

      <nav aria-label="Paginação" className="flex justify-between gap-3">
        {page > 1 ? (
          <Link href={`/glicemia?pagina=${page - 1}`} className="flex min-h-12 items-center px-3 text-base underline underline-offset-4">
            ← Mais recentes
          </Link>
        ) : (
          <span />
        )}
        {hasMore && (
          <Link href={`/glicemia?pagina=${page + 1}`} className="flex min-h-12 items-center px-3 text-base underline underline-offset-4">
            Mais antigos →
          </Link>
        )}
      </nav>

      <p className="text-sm text-muted-foreground">
        As faixas usadas são as que você definiu em <Link href="/metas" className="underline">Metas</Link>.
        O app organiza seus registros e não substitui o acompanhamento médico. Dúvidas sobre como registrar? Veja as <Link href="/orientacoes" className="underline">Orientações</Link>.
      </p>
    </section>
  );
}
