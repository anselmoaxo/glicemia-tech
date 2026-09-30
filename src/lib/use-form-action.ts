"use client";

import { startTransition, useActionState, useCallback } from "react";

/**
 * Como useActionState, mas o formulário é enviado por onSubmit em vez de `<form action>`.
 *
 * Motivo: o React 19 limpa os campos depois de todo `<form action>`, inclusive quando a ação só
 * devolve uma mensagem de erro, e a pessoa perde tudo o que digitou. Enviando manualmente os valores ficam.
 *
 * Uso: const [state, onSubmit, pending] = useFormAction(action, {}); <form onSubmit={onSubmit}>
 */
export function useFormAction<S extends object>(
  action: (state: S, formData: FormData) => Promise<S>,
  initial: S,
) {
  // Os tipos genéricos de useActionState (Awaited<S>) não fecham com S genérico; o formato é este.
  const [state, dispatch, pending] = useActionState(action, initial as Awaited<S>) as unknown as [
    S,
    (payload: FormData) => void,
    boolean,
  ];

  const onSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const form = event.currentTarget;
      const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLElement | null;
      // inclui name/value do botão que enviou, como no envio nativo
      const formData = submitter ? new FormData(form, submitter) : new FormData(form);
      startTransition(() => dispatch(formData));
    },
    [dispatch],
  );

  return [state, onSubmit, pending] as const;
}
