import { revokeFamilyMember } from "@/app/(app)/compartilhar/actions";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { InviteForm } from "@/components/invite-form";
import { MemberPermissionsForm } from "@/components/member-permissions-form";
import { fmtDateTime } from "@/lib/admin-format";
import { listAccessLogs } from "@/lib/privacy/access-log";
import { getMaxCompanions } from "@/lib/settings";
import { listSharingEvents, SHARING_ACTION_LABEL, type SharingAction } from "@/lib/sharing/audit";
import type { SharingContext } from "@/lib/sharing/manage";
import { moduleLabel } from "@/lib/sharing/modules";
import { listFamilyMembers } from "@/lib/sharing/queries";
import { INVITE_DAYS, inviteExpired, occupiesSlot, ROLE_LABEL, type MemberRole } from "@/lib/sharing/rules";

const STATUS = { pending: "Convite pendente", accepted: "Acesso ativo", revoked: "Revogado" } as const;

const ACCESS_LABEL = {
  relatorio: "baixou o relatório",
  configuracao: "alterou as configurações de acompanhamento",
  acompanhamento: "viu o acompanhamento",
} as const;

/**
 * Tela de compartilhamento de um perfil: quem tem acesso, convites, permissões, histórico e acessos.
 * Serve ao titular (/compartilhar) e ao responsável legal de um menor (/familia/[id]/compartilhamento). Os botões só
 * aparecem para quem pode usá-los, mas a permissão de verdade é conferida de novo no servidor, em cada ação.
 */
export async function SharingManager({ ownerId, ctx }: { ownerId: string; ctx: SharingContext }) {
  const [members, events, accesses, max] = await Promise.all([
    listFamilyMembers(ownerId),
    listSharingEvents(ownerId),
    listAccessLogs(ownerId),
    getMaxCompanions(),
  ]);
  const used = members.filter((m) => occupiesSlot(m)).length;
  const { authority } = ctx;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2 rounded-2xl border bg-card p-4 text-base">
        <h2 className="text-xl font-semibold">Como funciona</h2>
        <ul className="list-disc pl-5">
          <li>Quem você convida só <strong>vê</strong> os itens liberados. Não cria, não edita e não exclui registros.</li>
          <li>Não muda metas, lembretes, senha ou e-mail, e não pode convidar outras pessoas.</li>
          <li>Você vê aqui quem tem acesso e pode revogar a qualquer momento. Tudo fica no histórico abaixo.</li>
          <li>Os dados aparecem quando são registrados no app. Não é monitoramento em tempo real.</li>
        </ul>
      </div>

      {ctx.ownerIsMinor && ctx.actor === "owner" && (
        <p role="note" className="rounded-2xl border bg-secondary p-4 text-base">
          Como você tem menos de 18 anos, novos convites e mudanças no que cada pessoa pode ver são feitos pelo seu
          responsável legal. Você continua vendo quem tem acesso e pode revogar o acesso de acompanhantes.
        </p>
      )}

      {authority.canInvite && (
        <div className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold">Convidar alguém para acompanhar</h2>
          <p className="text-base text-muted-foreground">
            {used} de {max} {max === 1 ? "vaga usada" : "vagas usadas"} (convites pendentes contam).
          </p>
          {used >= max ? (
            <p className="text-base">Limite atingido. Revogue um acesso ou cancele um convite pendente para convidar outra pessoa.</p>
          ) : (
            <InviteForm ownerId={ownerId} days={INVITE_DAYS} />
          )}
        </div>
      )}

      <div className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold">Quem tem acesso</h2>
        {members.length === 0 && <p className="text-base text-muted-foreground">Ninguém ainda.</p>}
        <ul className="flex flex-col gap-4">
          {members.map((m) => {
            const role = m.role as MemberRole;
            const expired = inviteExpired(m);
            return (
              <li key={m.id} className="flex flex-col gap-2 rounded-2xl border bg-card p-4">
                <p className="break-all text-lg font-semibold">{m.email}</p>
                <p className="text-base">
                  {ROLE_LABEL[role] ?? "Acompanhante"} · {expired ? "Convite expirado" : STATUS[m.status as keyof typeof STATUS]}
                  {m.status === "pending" && !expired && ` até ${fmtDateTime(m.inviteExpiresAt)}`}
                </p>
                {m.status !== "revoked" && (
                  <p className="text-base text-muted-foreground">
                    Pode ver: {role === "guardian" ? "todos os registros" : m.modules.map(moduleLabel).join(", ")}
                  </p>
                )}
                {m.status !== "revoked" && role === "companion" && authority.canEditPermissions && (
                  <MemberPermissionsForm ownerId={ownerId} memberId={m.id} modules={m.modules} />
                )}
                {m.status !== "revoked" && authority.canRevoke(role) && (
                  <form action={revokeFamilyMember.bind(null, ownerId)}>
                    <input type="hidden" name="id" value={m.id} />
                    <ConfirmDeleteButton
                      label={m.status === "pending" ? "Cancelar convite" : "Revogar acesso"}
                      message={m.status === "pending" ? "Cancelar este convite?" : "Revogar o acesso desta pessoa? Ela deixa de ver os dados na hora."}
                    />
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
        {accesses.length === 0 && <p className="text-base text-muted-foreground">Nenhum acesso de acompanhantes até agora.</p>}
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
