import type { Metadata } from "next";
import Link from "next/link";
import { GlucoseChart } from "@/components/glucose-chart";
import { StatCard } from "@/components/stat-card";
import { dateToLocalInputs, formatDateTime } from "@/lib/datetime";
import { getRecentAlerts } from "@/lib/alerts/service";
import { getTodayDoses } from "@/lib/medications/queries";
import { classify, OUT_OF_RANGE_MESSAGE, STATUS_LABEL } from "@/lib/glucose/classify";
import { contextLabel } from "@/lib/glucose/contexts";
import { getChartSeries, getLatestReading, getPeriodStats } from "@/lib/glucose/dashboard";
import { parsePeriod, PERIODS, periodStart } from "@/lib/glucose/period";
import { getTargets } from "@/lib/glucose/queries";
import { formatUnits } from "@/lib/insulin/options";
import { getLastInsulinLog } from "@/lib/insulin/queries";
import { getLastMeal } from "@/lib/meals/queries";
import { mealLabel } from "@/lib/meals/types";
import { getProfile } from "@/lib/profile";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Início" };

export default async function InicioPage({ searchParams }: PageProps<"/inicio">) {
  const user = await requireUser();
  const period = parsePeriod((await searchParams).periodo);
  const since = periodStart(period);

  const profile = await getProfile(user.id);
  const timezone = profile.timezone;
  const today = dateToLocalInputs(new Date(), timezone).date;

  const [latest, stats, series, targets, lastMeal, todayDoses, lastInsulin, recentAlerts] = await Promise.all([
    getLatestReading(user.id),
    getPeriodStats(user.id, since),
    getChartSeries(user.id, since),
    getTargets(user.id),
    getLastMeal(user.id),
    getTodayDoses(user.id, today, timezone),
    getLastInsulinLog(user.id),
    getRecentAlerts(user.id),
  ]);

  // Próxima dose pendente; se não houver futura, a primeira atrasada.
  const pending = todayDoses.filter((d) => !d.status);
  const now = new Date();
  const nextDose = pending.find((d) => d.scheduledFor >= now) ?? pending[0] ?? null;

  const latestStatus = latest ? classify(latest.value, latest.contextKey, targets) : null;
  const outOfRange = latestStatus === "low" || latestStatus === "high";
  const fmt = (n: number | null) => (n === null ? "—" : String(n));

  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold">Olá, {user.name.split(" ")[0]}</h1>

      <Link
        href="/glicemia/nova"
        className="flex min-h-16 items-center justify-center rounded-xl bg-primary px-6 text-xl font-semibold text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        Registrar glicemia
      </Link>
      <Link
        href="/refeicoes/nova"
        className="flex min-h-14 items-center justify-center rounded-xl border-2 border-primary px-6 text-lg font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        Registrar refeição
      </Link>

      <Link
        href="/medicamentos"
        className="flex min-h-14 items-center justify-center rounded-xl border-2 border-primary px-6 text-lg font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        Registrar medicamento
      </Link>
      <Link
        href="/insulina/nova"
        className="flex min-h-14 items-center justify-center rounded-xl border-2 border-primary px-6 text-lg font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        Registrar insulina
      </Link>

      <div className="flex flex-col gap-1 rounded-xl border p-4">
        <p className="text-base text-muted-foreground">Próximo medicamento</p>
        {nextDose ? (
          <p className="text-base">
            <span className="font-semibold">{nextDose.med.name}</span> · {nextDose.time} ·{" "}
            {nextDose.med.dose} {nextDose.med.unit}
            {nextDose.scheduledFor < new Date() && " (atrasado)"}
          </p>
        ) : (
          <p className="text-base">Nenhuma dose pendente hoje.</p>
        )}
      </div>

      <div className="flex flex-col gap-1 rounded-xl border-2 p-4">
        <p className="text-base text-muted-foreground">Última glicemia</p>
        {latest ? (
          <>
            <p className="text-5xl font-bold">
              {latest.value} <span className="text-lg font-normal text-muted-foreground">mg/dL</span>
            </p>
            <p className="text-base">
              {formatDateTime(latest.measuredAt, profile.timezone)} ·{" "}
              {contextLabel(latest.contextKey, latest.customLabel)}
            </p>
            {latestStatus !== "no_target" && latestStatus && (
              <p className="text-base font-semibold">{STATUS_LABEL[latestStatus]}</p>
            )}
            {outOfRange && <p className="text-sm text-muted-foreground">{OUT_OF_RANGE_MESSAGE}</p>}
          </>
        ) : (
          <p className="text-base">Você ainda não registrou nenhuma medição.</p>
        )}
      </div>

      <div className="flex flex-col gap-1 rounded-xl border p-4">
        <p className="text-base text-muted-foreground">Última refeição</p>
        {lastMeal ? (
          <p className="text-base">
            <span className="font-semibold">{mealLabel(lastMeal.mealType, lastMeal.customType)}</span> ·{" "}
            {formatDateTime(lastMeal.eatenAt, profile.timezone)}
          </p>
        ) : (
          <p className="text-base">Nenhuma refeição registrada.</p>
        )}
      </div>

      <div className="flex flex-col gap-1 rounded-xl border p-4">
        <p className="text-base text-muted-foreground">Última aplicação de insulina</p>
        {lastInsulin ? (
          <p className="text-base">
            <span className="font-semibold">{formatUnits(lastInsulin.units)} unidades</span> ·{" "}
            {lastInsulin.typeName} · {formatDateTime(lastInsulin.appliedAt, timezone)}
          </p>
        ) : (
          <p className="text-base">Nenhuma aplicação registrada.</p>
        )}
      </div>

      <div className="flex flex-col gap-2 rounded-xl border p-4">
        <p className="text-base text-muted-foreground">Alertas recentes (7 dias)</p>
        {recentAlerts.length === 0 ? (
          <p className="text-base">Nenhum valor fora da faixa.</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {recentAlerts.map((a) => (
              <li key={a.id} className="text-base">
                <span className="font-semibold">{a.value} mg/dL</span> ·{" "}
                {a.direction === "low" ? "abaixo" : "acima"} da faixa · {formatDateTime(a.measuredAt, timezone)}
              </li>
            ))}
          </ul>
        )}
      </div>

      <nav aria-label="Período" className="grid grid-cols-4 gap-2">
        {PERIODS.map((p) => (
          <Link
            key={p}
            href={`/inicio?periodo=${p}`}
            aria-current={p === period ? "page" : undefined}
            className="flex min-h-12 items-center justify-center rounded-lg border-2 text-base font-medium aria-[current=page]:border-primary aria-[current=page]:bg-primary aria-[current=page]:text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            {p} dias
          </Link>
        ))}
      </nav>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label={`Média (${period} dias)`} value={fmt(stats.average)} hint={`${stats.total} medições`} />
        <StatCard label="Menor valor" value={fmt(stats.lowest)} />
        <StatCard label="Maior valor" value={fmt(stats.highest)} />
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold">Evolução</h2>
        {series.length === 0 ? (
          <p className="text-base text-muted-foreground">Sem medições nos últimos {period} dias.</p>
        ) : (
          <GlucoseChart
            points={series}
            target={targets.geral ?? null}
            timezone={profile.timezone}
            summary={`Gráfico de glicemia dos últimos ${period} dias, ${stats.total} medições, média ${fmt(stats.average)} mg/dL, de ${fmt(stats.lowest)} a ${fmt(stats.highest)} mg/dL.`}
          />
        )}
        {targets.geral && series.length > 0 && (
          <p className="text-sm text-muted-foreground">
            Faixa verde: sua meta geral ({targets.geral.min}–{targets.geral.max} mg/dL).
          </p>
        )}
      </div>
    </section>
  );
}
