import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DeleteUserForm } from "@/components/delete-user-form";
import { requireAdmin, roleOf, ROLE_LABEL } from "@/lib/admin";
import { fmtDateTime } from "@/lib/admin-format";
import { getUserSummary } from "@/lib/admin-queries";
import { endSessions, grantAdmin, revokeAdmin, suspendUser, unsuspendUser, verifyEmailManually } from "../../actions";

export const metadata: Metadata = { title: "Usuário" };

const Item = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div>
    <dt className="text-muted-foreground">{label}</dt>
    <dd className="font-semibold">{value}</dd>
  </div>
);

export default async function AdminUsuarioPage({ params }: PageProps<"/admin/usuarios/[id]">) {
  const admin = await requireAdmin();
  const { id } = await params;
  if (id.length > 64) notFound();
  const u = await getUserSummary(id);
  if (!u) notFound();

  const role = roleOf(u.id, u.adminSince);
  const protectedAccount = u.id === admin.id || role !== "user";
  const iAmOwner = admin.role === "owner";

  return (
    <section className="flex flex-col gap-6">
      <Link href="/admin/usuarios" className="flex min-h-12 items-center text-base underline underline-offset-4">
        ← Voltar para usuários
      </Link>

      <div>
        <h1 className="text-3xl font-bold">{u.name}</h1>
        <p className="break-all text-base text-muted-foreground">{u.email}</p>
        <p className="mt-2 flex flex-wrap gap-2">
          {u.suspendedAt ? (
            <span className="rounded-full border border-high/30 bg-high-soft px-3 py-1 text-base font-semibold text-high">Pausado em {fmtDateTime(u.suspendedAt)}</span>
          ) : (
            <span className="rounded-full border border-ok/30 bg-ok-soft px-3 py-1 text-base font-semibold text-ok">Ativo</span>
          )}
          {role !== "user" && <span className="rounded-full border border-primary/30 bg-accent px-3 py-1 text-base font-semibold text-accent-foreground">{ROLE_LABEL[role]}</span>}
        </p>
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-2xl border bg-card p-4 text-base">
        <Item label="Cadastro" value={fmtDateTime(u.createdAt)} />
        <Item label="Último acesso" value={fmtDateTime(u.lastActive)} />
        <Item label="E-mail confirmado" value={u.emailVerified ? "Sim" : "Não"} />
        <Item label="Duas etapas" value={u.twoFactorEnabled ? "Ativada" : "Desativada"} />
        <Item label="Papel" value={ROLE_LABEL[role]} />
        <Item label="Sessões abertas" value={u.activeSessions} />
        <Item label="Vínculos familiares" value={u.familyLinks} />
        <Item label="Solicitações em aberto" value={u.openRequests} />
      </dl>
      <p className="-mt-3 text-base text-muted-foreground">
        A administração vê só dados da conta. Registros de saúde e conversas não aparecem aqui.
      </p>

      {iAmOwner && u.id !== admin.id && role !== "owner" && (
        <div className="flex flex-col gap-2 rounded-2xl border bg-card p-4">
          <h2 className="text-xl font-bold">Papel de administrador</h2>
          <p className="text-base text-muted-foreground">
            {role === "admin"
              ? "Remover o papel encerra as sessões da pessoa e ela perde o acesso à administração."
              : "Administradores gerenciam contas, solicitações e e-mails, mas nunca veem registros de saúde. O acesso exige verificação em duas etapas, e a conta precisa estar ativa e com o e-mail confirmado."}
          </p>
          <form action={role === "admin" ? revokeAdmin : grantAdmin}>
            <input type="hidden" name="id" value={u.id} />
            <button
              disabled={role === "user" && (!u.emailVerified || Boolean(u.suspendedAt))}
              className="min-h-12 w-full rounded-lg border-2 border-primary text-base font-bold disabled:opacity-50"
            >
              {role === "admin" ? "Remover papel de administrador" : "Tornar administrador"}
            </button>
          </form>
        </div>
      )}

      {protectedAccount ? (
        <p className="rounded-2xl border bg-card p-4 text-base">
          Contas de administrador não podem ser pausadas, excluídas nem alteradas por aqui.
          {iAmOwner && role === "admin" ? " Remova o papel acima para poder gerenciá-la." : ""}
        </p>
      ) : (
        <>
          <div className="flex flex-col gap-3 rounded-2xl border bg-card p-4">
            <h2 className="text-xl font-bold">Acesso da conta</h2>
            <form action={endSessions} className="flex flex-col gap-1">
              <input type="hidden" name="id" value={u.id} />
              <p className="text-base text-muted-foreground">Desconecta a pessoa de todos os aparelhos. Ela entra de novo quando quiser.</p>
              <button className="min-h-12 w-full rounded-lg border-2 border-primary text-base font-bold">Encerrar todas as sessões</button>
            </form>
            {!u.emailVerified && (
              <form action={verifyEmailManually} className="flex flex-col gap-1 border-t pt-3">
                <input type="hidden" name="id" value={u.id} />
                <p className="text-base text-muted-foreground">Use só se o e-mail for confirmadamente da pessoa e o envio de confirmação não funcionou. Fica na auditoria.</p>
                <button className="min-h-12 w-full rounded-lg border-2 border-primary text-base font-bold">Confirmar e-mail manualmente</button>
              </form>
            )}
          </div>

          <div className="flex flex-col gap-2 rounded-2xl border bg-card p-4">
            <h2 className="text-xl font-bold">{u.suspendedAt ? "Reativar conta" : "Pausar conta"}</h2>
            <p className="text-base text-muted-foreground">
              {u.suspendedAt
                ? "A pessoa volta a poder entrar e os links e acessos de familiares voltam a funcionar."
                : "A pessoa é desconectada e não consegue entrar. Links de médico e acessos de familiares também param. Nada é apagado e dá para reativar a qualquer momento."}
            </p>
            <form action={u.suspendedAt ? unsuspendUser : suspendUser}>
              <input type="hidden" name="id" value={u.id} />
              <button className="min-h-12 w-full rounded-lg border-2 border-primary text-base font-bold">
                {u.suspendedAt ? "Reativar conta" : "Pausar conta"}
              </button>
            </form>
          </div>

          <div className="flex flex-col gap-2 rounded-2xl border border-high/40 bg-card p-4">
            <h2 className="text-xl font-bold text-high">Excluir conta</h2>
            <p className="text-base text-muted-foreground">
              Apaga definitivamente a conta e todos os dados dela. Não dá para desfazer; fica registrado na auditoria.
            </p>
            <DeleteUserForm id={u.id} email={u.email} />
          </div>
        </>
      )}
    </section>
  );
}
