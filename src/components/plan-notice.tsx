import Link from "next/link";
import { BellRing } from "lucide-react";
import { fmtDateTime } from "@/lib/admin-format";
import { listOpenEvents } from "@/lib/tracking/events";
import { getTrackingContext } from "@/lib/tracking/plan";

/** Aviso dentro do app (canal escolhido pela pessoa): só o que continua sem confirmação nas últimas 24 h. */
export async function PlanNotice({ userId }: { userId: string }) {
  const ctx = await getTrackingContext(userId);
  if (!ctx.diabetesVisible || !ctx.plan?.channelApp) return null;
  const open = await listOpenEvents(userId);
  if (open.length === 0) return null;
  return (
    <section role="status" aria-label="Avisos do acompanhamento" className="mx-auto mb-4 flex w-full max-w-3xl gap-3 rounded-2xl border bg-secondary p-4 text-base">
      <BellRing aria-hidden className="mt-0.5 size-6 shrink-0 text-primary" />
      <div>
        <p className="font-semibold">Sem confirmação nas últimas horas</p>
        <ul className="mt-1">
          {open.map((e) => (
            <li key={e.id}>{e.kind === "missed_measurement" ? "Medição prevista" : "Medicamento ou insulina"} · {fmtDateTime(e.slotAt)}</li>
          ))}
        </ul>
        <p className="mt-1 text-sm text-muted-foreground">
          Aviso para conferir: a falta de registro não significa que você não mediu ou não tomou. Siga o plano recebido do seu profissional de saúde.{" "}
          <Link href="/acompanhamento" className="underline">Configurar</Link>
        </p>
      </div>
    </section>
  );
}
