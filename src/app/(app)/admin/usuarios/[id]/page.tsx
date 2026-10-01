import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DeleteUserForm } from "@/components/delete-user-form";
import { isAdmin, requireAdmin } from "@/lib/admin";
import { fmtDateTime } from "@/lib/admin-format";
import { getUserSummary } from "@/lib/admin-queries";
import { suspendUser, unsuspendUser } from "../../actions";

export const metadata: Metadata = { title: "Usuário" };

export default async function AdminUsuarioPage({ params }: PageProps<"/admin/usuarios/[id]">) {
  const admin = await requireAdmin();
  const { id } = await params;
  if (id.length > 64) notFound();
  const u = await getUserSummary(id);
  if (!u) notFound();

  const protectedAccount = u.id === admin.id || isAdmin(u.id);
  const c = u.counts;

  return (
    <section className="flex flex-col gap-6">
      <Link href="/admin/usuarios" className="flex min-h-12 items-center text-base underline underline-offset-4">
        ← Voltar para usuários
      </Link>

      <div>
        <h1 className="text-3xl font-bold">{u.name}</h1>
        <p className="text-base break-all text-muted-foreground">{u.email}</p>
        {u.suspendedAt && (
          <p className="mt-2 inline-block rounded-full border border-high/30 bg-high-soft px-3 py-1 text-base font-semibold text-high">
            Suspenso em {fmtDateTime(u.suspendedAt)}
          </p>
        )}
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-2xl border bg-card p-4 text-base">
        <div><dt className="text-muted-foreground">Cadastro</dt><dd className="font-semibold">{fmtDateTime(u.createdAt)}</dd></div>
        <div><dt className="text-muted-foreground">Último acesso</dt><dd className="font-semibold">{fmtDateTime(u.lastActive)}</dd></div>
        <div><dt className="text-muted-foreground">Duas etapas</dt><dd className="font-semibold">{u.twoFactorEnabled ? "Ativada" : "Desativada"}</dd></div>
        <div><dt className="text-muted-foreground">Medições</dt><dd className="font-semibold">{c.readings}</dd></div>
        <div><dt className="text-muted-foreground">Refeições</dt><dd className="font-semibold">{c.meals}</dd></div>
        <div><dt className="text-muted-foreground">Medicamentos</dt><dd className="font-semibold">{c.medications}</dd></div>
        <div><dt className="text-muted-foreground">Aplicações de insulina</dt><dd className="font-semibold">{c.insulin}</dd></div>
        <div><dt className="text-muted-foreground">Familiares convidados</dt><dd className="font-semibold">{c.familyLinks}</dd></div>
      </dl>
      <p className="-mt-3 text-base text-muted-foreground">
        Por privacidade, o painel mostra apenas quantidades, nunca o conteúdo dos registros de saúde.
      </p>

      {protectedAccount ? (
        <p className="rounded-2xl border bg-card p-4 text-base">Contas de administrador não podem ser suspensas nem excluídas por aqui.</p>
      ) : (
        <>
          <div className="flex flex-col gap-2 rounded-2xl border bg-card p-4">
            <h2 className="text-xl font-bold">{u.suspendedAt ? "Reativar conta" : "Suspender conta"}</h2>
            <p className="text-base text-muted-foreground">
              {u.suspendedAt
                ? "A pessoa volta a poder entrar e os links e acessos de familiares voltam a funcionar."
                : "A pessoa é desconectada e não consegue entrar. Links de médico e acessos de familiares também param. Nada é apagado."}
            </p>
            <form action={u.suspendedAt ? unsuspendUser : suspendUser}>
              <input type="hidden" name="id" value={u.id} />
              <button className="min-h-12 w-full rounded-lg border-2 border-primary text-base font-bold">
                {u.suspendedAt ? "Reativar conta" : "Suspender conta"}
              </button>
            </form>
          </div>

          <div className="flex flex-col gap-2 rounded-2xl border border-high/40 bg-card p-4">
            <h2 className="text-xl font-bold text-high">Excluir conta</h2>
            <p className="text-base text-muted-foreground">
              Apaga definitivamente a conta e todos os registros dela. Não dá para desfazer.
            </p>
            <DeleteUserForm id={u.id} email={u.email} />
          </div>
        </>
      )}
    </section>
  );
}
