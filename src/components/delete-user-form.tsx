"use client";

import { deleteUser, type AdminState } from "@/app/admin/actions";
import { useFormAction } from "@/lib/use-form-action";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function DeleteUserForm({ id, email }: { id: string; email: string }) {
  const [state, action, pending] = useFormAction<AdminState>(deleteUser, {});
  return (
    <form onSubmit={action} className="flex flex-col gap-3">
      <input type="hidden" name="id" value={id} />
      <Label htmlFor="confirmEmail" className="text-base">
        Para excluir, digite o e-mail da conta: <span className="font-semibold break-all">{email}</span>
      </Label>
      <Input id="confirmEmail" name="confirmEmail" type="email" autoComplete="off" required className="h-12 text-base" />
      {state.error && <p role="alert" className="text-base font-medium text-destructive">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="min-h-12 rounded-lg bg-destructive px-4 text-base font-bold text-white disabled:opacity-50"
      >
        {pending ? "Excluindo..." : "Excluir conta e todos os dados"}
      </button>
    </form>
  );
}
