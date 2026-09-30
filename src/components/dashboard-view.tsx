import { Droplet, Pill, Syringe, TriangleAlert, Utensils } from "lucide-react";
import Link from "next/link";
import type { GlucoseStatus, Targets } from "@/lib/glucose/classify";
import { PERIODS, type Period } from "@/lib/glucose/period";
import { GlucoseChart } from "./glucose-chart";
import { EmptyMeterPanel, MeterPanel } from "./meter-panel";

export type DashboardProps = {
  firstName: string;
  todayLabel: string;
  timezone: string;
  latest: { value: number; status: GlucoseStatus; caption: string } | null;
  targets: Targets;
  period: Period;
  periodHref: (p: Period) => string;
  stats: { average: number | null; lowest: number | null; highest: number | null; total: number };
  series: { t: number; value: number }[];
  nextDose: { text: string; late: boolean } | null;
  lastMeal: string | null;
  lastInsulin: string | null;
  alerts: { id: string; text: string }[];
  hrefs: { glucose: string; meal: string; medication: string; insulin: string; metas: string };
};

const fmt = (n: number | null) => (n === null ? "—" : String(n));

const tile =
  "flex min-h-24 flex-col items-center justify-center gap-2 rounded-2xl border bg-card px-2 text-center text-base font-semibold transition-colors hover:bg-accent";

function Row({ icon: Icon, label, children }: { icon: typeof Pill; label: string; children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-4 px-4 py-4">
      <span aria-hidden className="grid size-11 shrink-0 place-items-center rounded-full bg-secondary text-primary">
        <Icon className="size-5" />
      </span>
      <div className="min-w-0">
        <p className="text-base text-muted-foreground">{label}</p>
        <p className="text-lg leading-snug font-semibold">{children}</p>
      </div>
    </li>
  );
}

export function DashboardView(p: DashboardProps) {
  const summary = `Gráfico de glicemia dos últimos ${p.period} dias, ${p.stats.total} medições, média ${fmt(p.stats.average)} mg/dL, de ${fmt(p.stats.lowest)} a ${fmt(p.stats.highest)} mg/dL.`;

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="text-base text-muted-foreground first-letter:uppercase">{p.todayLabel}</p>
        <h1 className="text-4xl font-bold tracking-tight">Olá, {p.firstName}</h1>
      </header>

      {p.latest ? (
        <MeterPanel
          value={p.latest.value}
          status={p.latest.status}
          caption={p.latest.caption}
          target={p.targets.geral ?? null}
          metasHref={p.hrefs.metas}
        />
      ) : (
        <EmptyMeterPanel href={p.hrefs.glucose} />
      )}

      <Link
        href={p.hrefs.glucose}
        className="flex min-h-16 items-center justify-center gap-3 rounded-2xl bg-primary px-6 text-xl font-bold text-primary-foreground transition-colors hover:bg-primary/90"
      >
        <Droplet aria-hidden className="size-6" />
        Registrar glicemia
      </Link>

      <div className="grid grid-cols-3 gap-3">
        <Link href={p.hrefs.meal} className={tile}>
          <Utensils aria-hidden className="size-6 text-primary" />
          Refeição
        </Link>
        <Link href={p.hrefs.medication} className={tile}>
          <Pill aria-hidden className="size-6 text-primary" />
          Remédio
        </Link>
        <Link href={p.hrefs.insulin} className={tile}>
          <Syringe aria-hidden className="size-6 text-primary" />
          Insulina
        </Link>
      </div>

      {p.alerts.length > 0 && (
        <section aria-label="Alertas recentes" className="flex gap-3 rounded-2xl border border-high/30 bg-high-soft p-4 text-high">
          <TriangleAlert aria-hidden className="mt-0.5 size-6 shrink-0" />
          <div>
            <h2 className="text-lg font-bold">Fora da faixa nos últimos 7 dias</h2>
            <ul className="mt-1 text-base text-foreground">
              {p.alerts.map((a) => (
                <li key={a.id}>{a.text}</li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <section aria-labelledby="hoje">
        <h2 id="hoje" className="mb-2 text-xl font-bold">Seu dia</h2>
        <ul className="divide-y rounded-2xl border bg-card">
          <Row icon={Pill} label="Próximo medicamento">
            {p.nextDose ? (
              <>
                {p.nextDose.text}
                {p.nextDose.late && <span className="ml-2 text-high">atrasado</span>}
              </>
            ) : (
              <span className="font-normal text-muted-foreground">Nenhuma dose pendente hoje</span>
            )}
          </Row>
          <Row icon={Utensils} label="Última refeição">
            {p.lastMeal ?? <span className="font-normal text-muted-foreground">Nenhuma registrada</span>}
          </Row>
          <Row icon={Syringe} label="Última insulina">
            {p.lastInsulin ?? <span className="font-normal text-muted-foreground">Nenhuma registrada</span>}
          </Row>
        </ul>
      </section>

      <section aria-labelledby="evolucao" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="evolucao" className="text-xl font-bold">Evolução</h2>
          <nav aria-label="Período" className="flex rounded-full bg-secondary p-1">
            {PERIODS.map((d) => (
              <Link
                key={d}
                href={p.periodHref(d)}
                aria-current={d === p.period ? "page" : undefined}
                className="flex min-h-11 min-w-14 items-center justify-center rounded-full px-3 text-base font-semibold text-muted-foreground aria-[current=page]:bg-primary aria-[current=page]:text-primary-foreground"
              >
                {d} d
              </Link>
            ))}
          </nav>
        </div>

        <dl className="grid grid-cols-3 divide-x rounded-2xl border bg-card text-center">
          {[
            ["Média", p.stats.average],
            ["Menor", p.stats.lowest],
            ["Maior", p.stats.highest],
          ].map(([label, v]) => (
            <div key={label as string} className="px-2 py-4">
              <dt className="text-base text-muted-foreground">{label}</dt>
              <dd className="font-lcd text-3xl font-semibold">{fmt(v as number | null)}</dd>
            </div>
          ))}
        </dl>
        <p className="-mt-1 text-base text-muted-foreground">
          {p.stats.total} {p.stats.total === 1 ? "medição" : "medições"} nos últimos {p.period} dias · valores em mg/dL
        </p>

        <div className="rounded-2xl border bg-card p-3">
          {p.series.length === 0 ? (
            <p className="p-4 text-base text-muted-foreground">Sem medições neste período.</p>
          ) : (
            <GlucoseChart points={p.series} target={p.targets.geral ?? null} timezone={p.timezone} summary={summary} />
          )}
        </div>
        {p.targets.geral && p.series.length > 0 && (
          <p className="text-base text-muted-foreground">
            A faixa verde no gráfico é a sua meta geral ({p.targets.geral.min}–{p.targets.geral.max} mg/dL).
          </p>
        )}
      </section>
    </div>
  );
}
