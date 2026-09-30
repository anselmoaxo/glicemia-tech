"use client";

import { useFormStatus } from "react-dom";

export function ConfirmDeleteButton({
  label = "Excluir",
  message = "Excluir este registro? Essa ação não pode ser desfeita.",
}: {
  label?: string;
  message?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      onClick={(e) => {
        if (!confirm(message)) e.preventDefault();
      }}
      className="flex min-h-12 w-full items-center justify-center rounded-lg border-2 border-destructive text-base font-medium text-destructive focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-50"
    >
      {pending ? "Aguarde..." : label}
    </button>
  );
}
