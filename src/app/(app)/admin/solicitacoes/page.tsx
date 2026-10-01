import { desc, eq, ne } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { db } from "@/db";
import { familyMembers, supportRequests, users } from "@/db/schema";
import { requireAdmin } from "@/lib/admin";
import { fmtDateTime } from "@/lib/admin-format";
import { kindLabel, STATUS_LABEL } from "@/lib/privacy/support";
import { moduleLabel } from "@/lib/sharing/modules";
import { revokeLink, updateRequestStatus } from "./actions";

export const metadata = { title: "Solicitações e vínculos" };

export default async function SolicitacoesPage() {
  await requireAdmin();

  // Mensagens de suporte são texto livre escrito pelo usuário (sem dados de saúde por orientação da tela).
  const requests = await db
    .select({
      id: supportRequests.id,
      kind: supportRequests.kind,
      message: supportRequests.message,
      status: supportRequests.status,
      createdAt: supportRequests.createdAt,
      email: users.email,
    })
    .from(supportRequests)
    .innerJoin(users, eq(users.id, supportRequests.userId))
    .orderBy(desc(supportRequests.createdAt))
    .limit(50);

  // Vínculos: só e-mails e status, nunca os dados compartilhados.
  const links = await db
    .select({
      id: familyMembers.id,
      memberEmail: familyMembers.email,
      status: familyMembers.status,
      createdAt: familyMembers.createdAt,
      ownerEmail: users.email,
    })
    .from(familyMembers)
    .innerJoin(users, eq(users.id, familyMembers.ownerId))
    .where(ne(familyMembers.status, "revoked"))
    .orderBy(desc(familyMembers.createdAt))
    .limit(50);

  return (
    <div className="flex flex-col gap-10">
      <section aria-labelledby="sol">
        <h1 id="sol" className="mb-3 text-xl font-bold">Solicitações (suporte, privacidade e exclusão)</h1>
        {requests.length === 0 ? (
          <p className="text-base text-muted-foreground">Nenhuma solicitação.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {requests.map((r) => (
              <li key={r.id} className="flex flex-col gap-2 rounded-2xl border bg-card p-4 text-base">
                <p><span className="font-semibold">{kindLabel(r.kind)}</span> · {STATUS_LABEL[r.status as keyof typeof STATUS_LABEL]}</p>
                <p className="break-all text-muted-foreground">{r.email} · {fmtDateTime(r.createdAt)}</p>
                <p className="whitespace-pre-line break-words">{r.message}</p>
                <form action={updateRequestStatus} className="flex flex-wrap gap-2">
                  <input type="hidden" name="id" value={r.id} />
                  {(["open", "in_progress", "done"] as const).filter((s) => s !== r.status).map((s) => (
                    <Button key={s} type="submit" name="status" value={s} variant="outline" className="h-11 text-base">
                      Marcar como {STATUS_LABEL[s].toLowerCase()}
                    </Button>
                  ))}
                </form>
                {r.kind === "exclusao" && (
                  <p className="text-sm text-muted-foreground">
                    Exclusão: confirme a identidade fora do app e use &ldquo;Usuários&rdquo; para excluir a conta (fica na auditoria).
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="vinc">
        <h2 id="vinc" className="mb-3 text-xl font-bold">Vínculos familiares ativos e pendentes</h2>
        {links.length === 0 ? (
          <p className="text-base text-muted-foreground">Nenhum vínculo.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {links.map((l) => (
              <li key={l.id} className="flex flex-col gap-2 rounded-2xl border bg-card p-4 text-base">
                <p className="break-all"><span className="font-semibold">{l.ownerEmail}</span> → {l.memberEmail}</p>
                <p className="text-muted-foreground">{l.status === "accepted" ? "Ativo" : "Convite pendente"} · {fmtDateTime(l.createdAt)}</p>
                <form action={revokeLink}>
                  <input type="hidden" name="id" value={l.id} />
                  <Button type="submit" variant="outline" className="h-11 text-base">Revogar vínculo</Button>
                </form>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-2 text-sm text-muted-foreground">
          {moduleLabel("glucose")} e demais permissões são definidas pelo titular. O painel não exibe os dados compartilhados.
        </p>
      </section>
    </div>
  );
}
