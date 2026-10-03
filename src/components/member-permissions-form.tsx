"use client";

import { updatePermissions, type PermissionsState } from "@/app/(app)/compartilhar/actions";
import { Button } from "@/components/ui/button";
import { SHARE_MODULES } from "@/lib/sharing/modules";
import { useFormAction } from "@/lib/use-form-action";

/** Muda o que um acompanhante vê sem derrubar o acesso dele. */
export function MemberPermissionsForm({ ownerId, memberId, modules }: { ownerId: string; memberId: string; modules: string[] }) {
  const [state, action, pending] = useFormAction<PermissionsState>(updatePermissions.bind(null, ownerId), {});
  return (
    <details className="rounded-lg border p-3">
      <summary className="flex min-h-12 cursor-pointer items-center text-base font-medium">Alterar o que pode ver</summary>
      <form onSubmit={action} className="mt-2 flex flex-col gap-2">
        <input type="hidden" name="id" value={memberId} />
        {SHARE_MODULES.map((m) => (
          <label key={m.key} className="flex min-h-12 items-center gap-3 text-base">
            <input type="checkbox" name="modules" value={m.key} defaultChecked={modules.includes(m.key)} className="size-6" />
            {m.label}
          </label>
        ))}
        {state.error && <p role="alert" className="text-base font-medium text-destructive">{state.error}</p>}
        {state.ok && <p role="status" className="text-base font-medium">Permissões atualizadas.</p>}
        <Button type="submit" variant="outline" disabled={pending} className="h-12 text-base">
          {pending ? "Salvando..." : "Salvar permissões"}
        </Button>
      </form>
    </details>
  );
}
