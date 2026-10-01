import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { fmtDate, fmtDateTime } from "@/lib/admin-format";
import { listUsers } from "@/lib/admin-queries";

export const metadata: Metadata = { title: "Usuários" };

export default async function AdminUsuariosPage({ searchParams }: PageProps<"/admin/usuarios">) {
  await requireAdmin();
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const page = Math.max(1, Number.parseInt(String(sp.pagina ?? "1"), 10) || 1);
  const { items, hasMore } = await listUsers(q, page);
  const qs = (p: number) => `/admin/usuarios?${new URLSearchParams({ ...(q ? { q } : {}), pagina: String(p) })}`;

  return (
    <section className="flex flex-col gap-5">
      <h1 className="text-3xl font-bold">Usuários</h1>

      <form method="get" className="flex gap-2" role="search">
        <label htmlFor="q" className="sr-only">Buscar por nome ou e-mail</label>
        <input
          id="q"
          name="q"
          defaultValue={q}
          maxLength={80}
          placeholder="Buscar por nome ou e-mail"
          className="h-12 min-w-0 flex-1 rounded-xl border border-input bg-card px-4 text-base"
        />
        <button className="min-h-12 rounded-xl bg-primary px-5 text-base font-bold text-primary-foreground">Buscar</button>
      </form>

      {items.length === 0 ? (
        <p className="text-base text-muted-foreground">Nenhum usuário encontrado.</p>
      ) : (
        <ul className="divide-y rounded-2xl border bg-card">
          {items.map((u) => (
            <li key={u.id}>
              <Link href={`/admin/usuarios/${u.id}`} className="flex flex-col gap-1 px-4 py-4 hover:bg-accent">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-lg font-semibold">{u.name}</span>
                  {u.suspendedAt && (
                    <span className="rounded-full border border-high/30 bg-high-soft px-2.5 py-0.5 text-sm font-semibold text-high">
                      Suspenso
                    </span>
                  )}
                </span>
                <span className="text-base break-all text-muted-foreground">{u.email}</span>
                <span className="text-base text-muted-foreground">
                  Cadastro {fmtDate(u.createdAt)} · último acesso {fmtDateTime(u.lastActive)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <nav aria-label="Paginação" className="flex justify-between gap-3">
        {page > 1 ? <Link href={qs(page - 1)} className="flex min-h-12 items-center px-3 text-base underline underline-offset-4">← Anteriores</Link> : <span />}
        {hasMore && <Link href={qs(page + 1)} className="flex min-h-12 items-center px-3 text-base underline underline-offset-4">Próximos →</Link>}
      </nav>
    </section>
  );
}
