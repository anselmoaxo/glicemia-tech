import type { Metadata } from "next";
import { InviteForm } from "@/components/invite-form";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { requireUser } from "@/lib/session";
import { moduleLabel } from "@/lib/sharing/modules";
import { listFamilyMembers } from "@/lib/sharing/queries";
import { revokeFamilyMember } from "./actions";

export const metadata: Metadata = { title: "Compartilhar" };

const STATUS = { pending: "Convite pendente", accepted: "Ativo", revoked: "Revogado" } as const;

export default async function CompartilharPage() {
  const user = await requireUser();
  const members = await listFamilyMembers(user.id);

  return (
    <section className="flex flex-col gap-8">
      <h1 className="text-3xl font-bold">Compartilhar com familiar</h1>
      <InviteForm />

      <div className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold">Familiares</h2>
        {members.length === 0 && <p className="text-base text-muted-foreground">Ninguém ainda.</p>}
        <ul className="flex flex-col gap-4">
          {members.map((m) => (
            <li key={m.id} className="flex flex-col gap-2 rounded-xl border p-4">
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
    </section>
  );
}
