import { DashboardView } from "@/components/dashboard-view";
import { formatDateTime, formatLongDate } from "@/lib/datetime";
import { contextLabel } from "@/lib/glucose/contexts";
import { parsePeriod } from "@/lib/glucose/period";
import { computeStats } from "@/lib/reports/stats";
import { mockReadings, TARGETS, TZ } from "./mock";

export default async function DemoHome({ searchParams }: PageProps<"/demo">) {
  const period = parsePeriod((await searchParams).periodo);
  const readings = mockReadings();
  const latest = readings[readings.length - 1];
  const stats = computeStats(readings.map((r) => r.value));
  const now = new Date();

  return (
    <DashboardView
      firstName="Maria"
      todayLabel={formatLongDate(now, TZ)}
      timezone={TZ}
      latest={{
        value: latest.value,
        status: latest.status,
        caption: `${formatDateTime(latest.measuredAt, TZ)} · ${contextLabel(latest.contextKey)}`,
      }}
      targets={TARGETS}
      period={period}
      periodHref={(p) => `/demo?periodo=${p}`}
      stats={{ average: stats.average, lowest: stats.lowest, highest: stats.highest, total: stats.count }}
      series={readings.map((r) => ({ t: r.measuredAt.getTime(), value: r.value }))}
      nextDose={{ text: "Metformina · 20:00 · 500 mg", late: false }}
      lastMeal="Almoço · hoje, 12:30"
      lastInsulin="10 un. NPH · hoje, 07:00"
      alerts={readings
        .filter((r) => r.status === "low" || r.status === "high")
        .slice(-2)
        .reverse()
        .map((r) => ({
          id: r.id,
          text: `${r.value} mg/dL, ${r.status === "low" ? "abaixo" : "acima"} da faixa · ${formatDateTime(r.measuredAt, TZ)}`,
        }))}
      hrefs={{ glucose: "/demo/registrar", meal: "/demo", medication: "/demo", insulin: "/demo", metas: "/demo" }}
    />
  );
}
