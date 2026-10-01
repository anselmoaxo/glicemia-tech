import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { ACTION_LABEL, fmtDateTime } from "@/lib/admin-format";
import { listAudit } from "@/lib/admin-queries";

export const metadata = { title: "Auditoria" };

export default async function AuditoriaPage({ searchParams }: PageProps<"/admin/auditoria">) {
  await requireAdmin();
  const page = Math.max(1, Number.parseInt(String((await searchParams).pagina ?? "1"), 10) || 1);
  const { items, hasMore } = await listAudit(page);

  return (
    <section className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold">Auditoria</h1>
      <p className="text-base text-muted-foreground">Ações administrativas registradas: quem fez, o quê e quando. Não guarda dados de saúde.</p>
      {items.length === 0 ? (
        <p className="text-base">Nenhuma ação registrada.</p>
      ) : (
        <ul className="divide-y rounded-2xl border bg-card">
          {items.map((l) => (
            <li key={l.id} className="px-4 py-3 text-base">
              <span className="font-semibold">{ACTION_LABEL[l.action as keyof typeof ACTION_LABEL] ?? l.action}</span>{" "}
              <span className="break-all">{l.targetEmail}</span>
              <span className="block text-sm text-muted-foreground">{fmtDateTime(l.createdAt)}</span>
            </li>
          ))}
        </ul>
      )}
      <nav aria-label="Paginação" className="flex justify-between gap-3">
        {page > 1 ? <Link href={`/admin/auditoria?pagina=${page - 1}`} className="flex min-h-12 items-center px-3 text-base underline underline-offset-4">← Anteriores</Link> : <span />}
        {hasMore && <Link href={`/admin/auditoria?pagina=${page + 1}`} className="flex min-h-12 items-center px-3 text-base underline underline-offset-4">Próximos →</Link>}
      </nav>
    </section>
  );
}
