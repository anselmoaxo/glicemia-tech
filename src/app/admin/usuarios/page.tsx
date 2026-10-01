import type { Metadata } from "next";
import Link from "next/link";
import { isAdmin, requireAdmin } from "@/lib/admin";
import { fmtDate, fmtDateTime } from "@/lib/admin-format";
import { listUsers, parseUserFilter, type UserFilter } from "@/lib/admin-queries";
import { suspendUser, unsuspendUser } from "../actions";

export const metadata: Metadata = { title: "Usuários" };

const FILTERS: { key: UserFilter; label: string }[] = [
  { key: "todos", label: "Todos" },
  { key: "ativos", label: "Ativos" },
  { key: "pausados", label: "Pausados" },
];

const badge = "rounded-full border px-2.5 py-0.5 text-sm font-semibold";

export default async function AdminUsuariosPage({ searchParams }: PageProps<"/admin/usuarios">) {
  const admin = await requireAdmin();
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const filter = parseUserFilter(sp.status);
  const page = Math.max(1, Number.parseInt(String(sp.pagina ?? "1"), 10) || 1);
  const { items, hasMore, total } = await listUsers(q, page, filter);
  const href = (p: number, f: UserFilter = filter) =>
    `/admin/usuarios?${new URLSearchParams({ ...(q ? { q } : {}), ...(f !== "todos" ? { status: f } : {}), ...(p > 1 ? { pagina: String(p) } : {}) })}`;

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h1 className="text-3xl font-bold">Usuários</h1>
        <p className="text-base text-muted-foreground">{total} {total === 1 ? "conta" : "contas"}</p>
      </div>

      <form method="get" className="flex gap-2" role="search">
        {filter !== "todos" && <input type="hidden" name="status" value={filter} />}
        <label htmlFor="q" className="sr-only">Buscar por nome ou e-mail</label>
        <input id="q" name="q" defaultValue={q} maxLength={80} placeholder="Buscar por nome ou e-mail" className="h-12 min-w-0 flex-1 rounded-xl border border-input bg-card px-4 text-base" />
        <button className="min-h-12 rounded-xl bg-primary px-5 text-base font-bold text-primary-foreground">Buscar</button>
      </form>

      <nav aria-label="Filtrar por situação" className="flex gap-1 rounded-full bg-secondary p-1 self-start">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={href(1, f.key)}
            aria-current={f.key === filter ? "page" : undefined}
            className="flex min-h-11 items-center rounded-full px-4 text-base font-semibold aria-[current=page]:bg-card aria-[current=page]:shadow-sm"
          >
            {f.label}
          </Link>
        ))}
      </nav>

      {items.length === 0 ? (
        <p className="text-base text-muted-foreground">Nenhum usuário encontrado.</p>
      ) : (
        <ul className="divide-y rounded-2xl border bg-card">
          {items.map((u) => {
            const protectedAccount = u.id === admin.id || isAdmin(u.id);
            return (
              <li key={u.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                <Link href={`/admin/usuarios/${u.id}`} className="flex min-w-0 flex-col gap-1 hover:underline">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-lg font-semibold">{u.name}</span>
                    {u.suspendedAt ? (
                      <span className={`${badge} border-high/30 bg-high-soft text-high`}>Pausado</span>
                    ) : (
                      <span className={`${badge} border-ok/30 bg-ok-soft text-ok`}>Ativo</span>
                    )}
                    {isAdmin(u.id) && <span className={`${badge} border-primary/30 bg-accent text-accent-foreground`}>Administrador</span>}
                    {!u.emailVerified && <span className={`${badge} text-muted-foreground`}>E-mail não confirmado</span>}
                    {u.twoFactorEnabled && <span className={`${badge} text-muted-foreground`}>2 etapas</span>}
                  </span>
                  <span className="break-all text-base text-muted-foreground">{u.email}</span>
                  <span className="text-sm text-muted-foreground">Cadastro {fmtDate(u.createdAt)} · último acesso {fmtDateTime(u.lastActive)}</span>
                </Link>
                {!protectedAccount && (
                  <form action={u.suspendedAt ? unsuspendUser : suspendUser} className="shrink-0">
                    <input type="hidden" name="id" value={u.id} />
                    <button className="min-h-11 w-full rounded-lg border-2 border-primary px-4 text-base font-bold sm:w-auto">
                      {u.suspendedAt ? "Reativar" : "Pausar"}
                    </button>
                  </form>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <nav aria-label="Paginação" className="flex justify-between gap-3">
        {page > 1 ? <Link href={href(page - 1)} className="flex min-h-12 items-center px-3 text-base underline underline-offset-4">← Anteriores</Link> : <span />}
        {hasMore && <Link href={href(page + 1)} className="flex min-h-12 items-center px-3 text-base underline underline-offset-4">Próximos →</Link>}
      </nav>
    </section>
  );
}
