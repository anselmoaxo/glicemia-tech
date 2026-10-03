import type { Metadata } from "next";
import { DashboardView } from "@/components/dashboard-view";
import { dateToLocalInputs, formatDateTime, formatLongDate } from "@/lib/datetime";
import { getRecentAlerts } from "@/lib/alerts/service";
import { classify } from "@/lib/glucose/classify";
import { contextLabel } from "@/lib/glucose/contexts";
import { getChartSeries, getLatestReading, getPeriodStats } from "@/lib/glucose/dashboard";
import { parsePeriod, periodStart } from "@/lib/glucose/period";
import { getTargets } from "@/lib/glucose/queries";
import { formatUnits } from "@/lib/insulin/options";
import { getLastInsulinLog } from "@/lib/insulin/queries";
import { getLastMeal } from "@/lib/meals/queries";
import { mealLabel } from "@/lib/meals/types";
import { getTodayDoses } from "@/lib/medications/queries";
import { getProfile } from "@/lib/profile";
import { PlanNotice } from "@/components/plan-notice";
import { ProfileNotices } from "@/components/profile-notices";
import { requireUser } from "@/lib/session";
import { getTrackingContext } from "@/lib/tracking/plan";

export const metadata: Metadata = { title: "Início" };

export default async function InicioPage({ searchParams }: PageProps<"/inicio">) {
  const user = await requireUser();
  const period = parsePeriod((await searchParams).periodo);
  const since = periodStart(period);

  const { timezone } = await getProfile(user.id);
  const now = new Date();
  const today = dateToLocalInputs(now, timezone).date;

  const [{ diabetesVisible }, latest, stats, series, targets, lastMeal, todayDoses, lastInsulin, recentAlerts] = await Promise.all([
    getTrackingContext(user.id),
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
  const next = pending.find((d) => d.scheduledFor >= now) ?? pending[0] ?? null;

  return (
    <>
    <ProfileNotices userId={user.id} />
    <PlanNotice userId={user.id} />
    <DashboardView
      firstName={user.name.split(" ")[0]}
      todayLabel={formatLongDate(now, timezone)}
      timezone={timezone}
      latest={
        latest && {
          value: latest.value,
          status: classify(latest.value, latest.contextKey, targets),
          caption: `${formatDateTime(latest.measuredAt, timezone)} · ${contextLabel(latest.contextKey, latest.customLabel)}`,
        }
      }
      targets={targets}
      period={period}
      periodHref={(p) => `/inicio?periodo=${p}`}
      stats={stats}
      series={series}
      nextDose={
        next && {
          text: `${next.med.name} · ${next.time} · ${next.med.dose} ${next.med.unit}`,
          late: next.scheduledFor < now,
        }
      }
      lastMeal={lastMeal && `${mealLabel(lastMeal.mealType, lastMeal.customType)} · ${formatDateTime(lastMeal.eatenAt, timezone)}`}
      lastInsulin={
        lastInsulin &&
        `${formatUnits(lastInsulin.units)} un. ${lastInsulin.typeName} · ${formatDateTime(lastInsulin.appliedAt, timezone)}`
      }
      alerts={(diabetesVisible ? recentAlerts : []).map((a) => ({
        id: a.id,
        text: `${a.value} mg/dL, ${a.direction === "low" ? "abaixo" : "acima"} da faixa · ${formatDateTime(a.measuredAt, timezone)}`,
      }))}
      hrefs={{
        glucose: "/glicemia/nova",
        meal: "/refeicoes/nova",
        medication: "/medicamentos",
        insulin: "/insulina/nova",
        metas: "/metas",
      }}
    />
    </>
  );
}
