import Link from "next/link";
import { OUT_OF_RANGE_MESSAGE, STATUS_LABEL, type GlucoseStatus } from "@/lib/glucose/classify";
import { gaugeGeometry } from "@/lib/glucose/gauge";

type Props = {
  value: number;
  status: GlucoseStatus;
  /** ex.: "hoje, 07:30 · Jejum" */
  caption: string;
  target: { min: number; max: number } | null;
  metasHref: string;
};

const numeral: Record<GlucoseStatus, string> = {
  in_range: "text-lcd-ink",
  no_target: "text-lcd-ink",
  high: "text-[#fde68a]",
  low: "text-[#bae6fd]",
};

const dot: Record<GlucoseStatus, string> = {
  in_range: "bg-[#5fd3a0]",
  no_target: "bg-white/50",
  high: "bg-[#fbbf24]",
  low: "bg-[#38bdf8]",
};

/** O "visor": última medição em destaque + régua mostrando onde ela cai na faixa do usuário. */
export function MeterPanel({ value, status, caption, target, metasHref }: Props) {
  const g = gaugeGeometry(value, target);
  const outOfRange = status === "low" || status === "high";

  return (
    <section aria-label="Última glicemia" className="rounded-[1.75rem] bg-lcd p-5 text-white">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-medium text-white/80">Última glicemia</h2>
        <span className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-base font-semibold">
          <span aria-hidden className={`size-2.5 rounded-full ${dot[status]}`} />
          {STATUS_LABEL[status]}
        </span>
      </div>

      <p className="mt-2 flex items-baseline gap-2">
        <span className={`font-lcd text-8xl leading-none font-semibold tracking-tight ${numeral[status]}`}>{value}</span>
        <span className="text-xl text-white/70">mg/dL</span>
      </p>
      <p className="mt-2 text-base text-white/80">{caption}</p>

      <div className="mt-6">
        <div
          role="img"
          aria-label={
            target
              ? `Faixa configurada de ${target.min} a ${target.max} mg/dL. Valor atual: ${value}.`
              : "Nenhuma faixa configurada."
          }
          className="relative h-3 rounded-full bg-white/15"
        >
          {g.band && (
            <span
              className="absolute inset-y-0 rounded-full bg-lcd-ink/45"
              style={{ left: `${g.band.left}%`, width: `${g.band.width}%` }}
            />
          )}
          <span
            className="absolute top-1/2 size-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-lcd bg-white shadow-[0_0_0_2px_rgba(255,255,255,0.9)]"
            style={{ left: `${g.marker}%` }}
          />
        </div>
        {target ? (
          <p className="mt-3 text-base text-white/80">
            Sua faixa: <span className="font-semibold text-white">{target.min}–{target.max}</span> mg/dL
          </p>
        ) : (
          <p className="mt-3 text-base text-white/80">
            <Link href={metasHref} className="font-semibold text-white underline underline-offset-4">
              Defina sua faixa
            </Link>{" "}
            para ver onde o valor se encaixa.
          </p>
        )}
      </div>

      {outOfRange && <p className="mt-4 border-t border-white/15 pt-3 text-base text-white/80">{OUT_OF_RANGE_MESSAGE}</p>}
    </section>
  );
}

export function EmptyMeterPanel({ href }: { href: string }) {
  return (
    <section aria-label="Última glicemia" className="rounded-[1.75rem] bg-lcd p-5 text-white">
      <h2 className="text-base font-medium text-white/80">Última glicemia</h2>
      <p className="mt-2 font-lcd text-8xl leading-none font-semibold text-lcd-ink/40">---</p>
      <p className="mt-3 text-lg">
        Nenhuma medição ainda.{" "}
        <Link href={href} className="font-semibold underline underline-offset-4">
          Registrar a primeira
        </Link>
      </p>
    </section>
  );
}
