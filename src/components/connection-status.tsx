"use client";

import { WifiOff } from "lucide-react";
import { useSyncExternalStore } from "react";

const subscribe = (cb: () => void) => {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => {
    window.removeEventListener("online", cb);
    window.removeEventListener("offline", cb);
  };
};

/** Sem conexão, a tela pode estar desatualizada e um registro novo não chega ao servidor: avisamos claramente. */
export function ConnectionStatus() {
  const online = useSyncExternalStore(subscribe, () => navigator.onLine, () => true);
  if (online) return null;
  return (
    <p role="alert" className="sticky top-0 z-40 flex items-center justify-center gap-2 bg-destructive px-4 py-2 text-center text-base font-medium text-white">
      <WifiOff aria-hidden className="size-5 shrink-0" />
      Sem conexão. Os dados na tela podem estar desatualizados e novos registros não serão salvos até a conexão voltar.
    </p>
  );
}
