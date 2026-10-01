"use client";

import dynamic from "next/dynamic";

// O Recharts é a maior biblioteca do app: só é baixado quando o gráfico vai aparecer, e o resto da tela não espera por ele.
export const GlucoseChart = dynamic(() => import("./glucose-chart").then((m) => m.GlucoseChart), {
  ssr: false,
  loading: () => (
    <div role="status" aria-live="polite" className="grid h-72 w-full place-items-center rounded-2xl bg-muted text-base text-muted-foreground">
      Carregando gráfico...
    </div>
  ),
});
