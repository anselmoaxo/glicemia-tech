import type { Metadata } from "next";
import { InviteForm } from "@/components/invite-form";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { requireUser } from "@/lib/session";
import { moduleLabel } from "@/lib/sharing/modules";
import { listFamilyMembers } from "@/lib/sharing/queries";
import { fmtDateTime } from "@/lib/admin-format";
import { listAccessLogs } from "@/lib/privacy/access-log";
import { revokeFamilyMember } from "./actions";

export const metadata: Metadata = { title: "Compartilhar" };

const STATUS = { pending: "Convite pendente", accepted: "Ativo", revoked: "Revogado" } as const;

export default async function CompartilharPage() {
  const user = await requireUser();
  const [members, accesses] = await Promise.all([listFamilyMembers(user.id), listAccessLogs(user.id)]);

  return (
    <section className="flex flex-col gap-8">
      <h1 className="text-3xl font-bold">Compartilhar com familiar</h1>
      <InviteForm />

      <div className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold">Familiares</h2>
        {members.length === 0 && <p className="text-base text-muted-foreground">Ninguém ainda.</p>}
        <ul className="flex flex-col gap-4">
          {members.map((m) => (
            <li key={m.id} className="flex flex-col gap-2 rounded-2xl border bg-card p-4">
              <p className="break-all text-lg font-semibold">{m.email}</p>
              <p className="text-base">{STATUS[m.status as keyof typeof STATUS]}</p>
              <p className="text-base text-muted-foreground">
                Pode ver: {m.modules.map(moduleLabel).join(", ")}
              </p>
              {m.status !== "revoked" && (
                <form action={revokeFamilyMember}>
                  <input type="hidden" name="id" value={m.id} />
                  <ConfirmDeleteButton label="Revogar acesso" message="Revogar o acesso deste familiar?" />
                </form>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold">Quem acessou meus dados</h2>
        {accesses.length === 0 && <p className="text-base text-muted-foreground">Nenhum acesso de familiares até agora.</p>}
        <ul className="flex flex-col gap-2">
          {accesses.map((a) => (
            <li key={a.id} className="rounded-2xl border bg-card p-3 text-base">
              <span className="font-semibold">{a.viewerName ?? "Conta removida"}</span> ·{" "}
              {a.resource === "relatorio" ? "baixou o relatório" : a.resource === "configuracao" ? "alterou as configurações de acompanhamento" : "viu o acompanhamento"}
              <span className="block text-muted-foreground">{fmtDateTime(a.createdAt)}</span>
            </li>
          ))}
        </ul>
        <p className="text-sm text-muted-foreground">
          Familiares só leem: não editam nem excluem nada. Revogue o acesso quando quiser.
        </p>
      </div>
    </section>
  );
}
