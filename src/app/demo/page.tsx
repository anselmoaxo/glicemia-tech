import Link from "next/link";
import { GlucoseChart } from "@/components/glucose-chart";
import { StatCard } from "@/components/stat-card";
import { formatDateTime } from "@/lib/datetime";
import { OUT_OF_RANGE_MESSAGE, STATUS_LABEL } from "@/lib/glucose/classify";
import { contextLabel } from "@/lib/glucose/contexts";
import { computeStats } from "@/lib/reports/stats";
import { mockReadings, TARGETS, TZ } from "./mock";

const btn =
  "flex min-h-14 items-center justify-center rounded-xl border-2 border-primary px-6 text-lg font-semibold";

export default function DemoHome() {
  const readings = mockReadings();
  const latest = readings[readings.length - 1];
  const stats = computeStats(readings.map((r) => r.value));
  const alerts = readings.filter((r) => r.status === "low" || r.status === "high").slice(-3).reverse();

  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold">Olá, Maria</h1>

      <Link href="/demo/registrar" className="flex min-h-16 items-center justify-center rounded-xl bg-primary px-6 text-xl font-semibold text-primary-foreground">
        Registrar glicemia
      </Link>
      <div className="grid grid-cols-2 gap-3">
        <span className={btn}>Refeição</span>
        <span className={btn}>Medicamento</span>
      </div>
      <span className={btn}>Registrar insulina</span>

      <div className="flex flex-col gap-1 rounded-xl border-2 p-4">
        <p className="text-base text-muted-foreground">Última glicemia</p>
        <p className="text-5xl font-bold">
          {latest.value} <span className="text-lg font-normal text-muted-foreground">mg/dL</span>
        </p>
        <p className="text-base">{formatDateTime(latest.measuredAt, TZ)} · {contextLabel(latest.contextKey)}</p>
        <p className="text-base font-semibold">{STATUS_LABEL[latest.status]}</p>
      </div>

      <div className="flex flex-col gap-1 rounded-xl border p-4">
        <p className="text-base text-muted-foreground">Próximo medicamento</p>
        <p className="text-base"><span className="font-semibold">Metformina</span> · 20:00 · 500 mg</p>
      </div>
      <div className="flex flex-col gap-1 rounded-xl border p-4">
        <p className="text-base text-muted-foreground">Última refeição</p>
        <p className="text-base"><span className="font-semibold">Almoço</span> · hoje, 12:30</p>
      </div>
      <div className="flex flex-col gap-1 rounded-xl border p-4">
        <p className="text-base text-muted-foreground">Última aplicação de insulina</p>
        <p className="text-base"><span className="font-semibold">10 unidades</span> · NPH · hoje, 07:00</p>
      </div>

      <div className="flex flex-col gap-2 rounded-xl border p-4">
        <p className="text-base text-muted-foreground">Alertas recentes (7 dias)</p>
        <ul className="flex flex-col gap-1">
          {alerts.map((a) => (
            <li key={a.id} className="text-base">
              <span className="font-semibold">{a.value} mg/dL</span> · {a.status === "low" ? "abaixo" : "acima"} da faixa · {formatDateTime(a.measuredAt, TZ)}
            </li>
          ))}
        </ul>
        <p className="text-sm text-muted-foreground">{OUT_OF_RANGE_MESSAGE}</p>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {[7, 14, 30, 90].map((p) => (
          <span key={p} aria-current={p === 7 ? "page" : undefined} className="flex min-h-12 items-center justify-center rounded-lg border-2 text-base font-medium aria-[current=page]:border-primary aria-[current=page]:bg-primary aria-[current=page]:text-primary-foreground">
            {p} dias
          </span>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="Média (7 dias)" value={String(stats.average)} hint={`${stats.count} medições`} />
        <StatCard label="Menor valor" value={String(stats.lowest)} />
        <StatCard label="Maior valor" value={String(stats.highest)} />
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold">Evolução</h2>
        <GlucoseChart
          points={readings.map((r) => ({ t: r.measuredAt.getTime(), value: r.value }))}
          target={TARGETS.geral}
          timezone={TZ}
          summary="Gráfico de demonstração da glicemia dos últimos 7 dias."
        />
        <p className="text-sm text-muted-foreground">Faixa verde: sua meta geral ({TARGETS.geral.min}–{TARGETS.geral.max} mg/dL).</p>
      </div>
    </section>
  );
}
