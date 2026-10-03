import { revokeFamilyMember } from "@/app/(app)/compartilhar/actions";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { fmtDateTime } from "@/lib/admin-format";
import { listAccessLogs } from "@/lib/privacy/access-log";
import { listSharingEvents, SHARING_ACTION_LABEL, type SharingAction } from "@/lib/sharing/audit";
import type { SharingContext } from "@/lib/sharing/manage";
import { moduleLabel } from "@/lib/sharing/modules";
import { listFamilyMembers } from "@/lib/sharing/queries";
import { ROLE_LABEL, type MemberRole } from "@/lib/sharing/rules";

const STATUS = { accepted: "Acesso ativo", revoked: "Revogado" } as const;

const ACCESS_LABEL = {
  relatorio: "baixou o relatório",
  configuracao: "alterou as configurações de acompanhamento",
  acompanhamento: "viu o acompanhamento",
} as const;

/**
 * Quem tem acesso ao perfil do titular (/compartilhar): só o responsável legal confirmado de um menor, já que o convite
 * de acompanhante foi retirado. Mostra também o histórico e os acessos. O botão de revogar só aparece para quem pode
 * usá-lo, mas a permissão de verdade é conferida de novo no servidor.
 */
export async function SharingManager({ ownerId, ctx }: { ownerId: string; ctx: SharingContext }) {
  const [all, events, accesses] = await Promise.all([listFamilyMembers(ownerId), listSharingEvents(ownerId), listAccessLogs(ownerId)]);
  // vínculos de acompanhante antigos não dão mais acesso; convites pendentes antigos não podem mais ser aceitos
  const members = all.filter((m) => m.role === "guardian" && m.status !== "pending");
  const { authority } = ctx;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2 rounded-2xl border bg-card p-4 text-base">
        <h2 className="text-xl font-semibold">Como funciona</h2>
        <ul className="list-disc pl-5">
          <li>Seus dados não são compartilhados com familiares por convite.</li>
          <li>
            Só o responsável legal, confirmado quando a conta é de alguém com menos de 18 anos, vê os registros, sem poder
            criar, editar ou excluir nada.
          </li>
          <li>Depois dos 18 anos, você pode revogar o acesso do antigo responsável aqui. Tudo fica no histórico abaixo.</li>
        </ul>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold">Quem tem acesso</h2>
        {members.length === 0 && <p className="text-base text-muted-foreground">Ninguém ainda.</p>}
        <ul className="flex flex-col gap-4">
          {members.map((m) => {
            const role = m.role as MemberRole;
            return (
              <li key={m.id} className="flex flex-col gap-2 rounded-2xl border bg-card p-4">
                <p className="break-all text-lg font-semibold">{m.email}</p>
                <p className="text-base">
                  {ROLE_LABEL[role]} · {STATUS[m.status as keyof typeof STATUS]}
                </p>
                {m.status !== "revoked" && (
                  <p className="text-base text-muted-foreground">
                    Pode ver: todos os registros
                  </p>
                )}
                {m.status !== "revoked" && authority.canRevoke(role) && (
                  <form action={revokeFamilyMember.bind(null, ownerId)}>
                    <input type="hidden" name="id" value={m.id} />
                    <ConfirmDeleteButton label="Revogar acesso" message="Revogar o acesso desta pessoa? Ela deixa de ver os dados na hora." />
                  </form>
                )}
                {m.status !== "revoked" && role === "guardian" && !authority.canRevoke(role) && (
                  <p className="text-sm text-muted-foreground">
                    O acesso do responsável legal continua enquanto o titular for menor de idade.
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold">Histórico do compartilhamento</h2>
        {events.length === 0 && <p className="text-base text-muted-foreground">Nenhuma mudança registrada ainda.</p>}
        <ul className="flex flex-col gap-2">
          {events.map((e) => (
            <li key={e.id} className="rounded-2xl border bg-card p-3 text-base">
              {e.action === "admin_revoke" ? null : <span className="font-semibold">{e.actorName ?? "Conta removida"} </span>}
              {SHARING_ACTION_LABEL[e.action as SharingAction] ?? e.action}
              {e.memberEmailMasked && ` ${e.memberEmailMasked}`}
              {e.modules && e.modules.length > 0 && ` · ${e.modules.map(moduleLabel).join(", ")}`}
              <span className="block text-muted-foreground">{fmtDateTime(e.createdAt)}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold">Quem acessou os dados</h2>
        {accesses.length === 0 && <p className="text-base text-muted-foreground">Nenhum acesso até agora.</p>}
        <ul className="flex flex-col gap-2">
          {accesses.map((a) => (
            <li key={a.id} className="rounded-2xl border bg-card p-3 text-base">
              <span className="font-semibold">{a.viewerName ?? "Conta removida"}</span> · {ACCESS_LABEL[a.resource as keyof typeof ACCESS_LABEL] ?? a.resource}
              <span className="block text-muted-foreground">{fmtDateTime(a.createdAt)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
