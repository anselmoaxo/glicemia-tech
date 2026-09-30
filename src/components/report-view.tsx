import { formatDateTime } from "@/lib/datetime";
import { STATUS_LABEL } from "@/lib/glucose/classify";
import { formatUnits, relationLabel } from "@/lib/insulin/options";
import { mealLabel } from "@/lib/meals/types";
import type { ReportData } from "@/lib/reports/data";
import { GlucoseChart } from "./glucose-chart";
import { StatCard } from "./stat-card";

const br = (iso: string) => iso.split("-").reverse().join("/");

function Section({ title, empty, children }: { title: string; empty: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-xl font-semibold">{title}</h2>
      {empty ? <p className="text-base text-muted-foreground">Sem registros no período.</p> : children}
    </div>
  );
}

const Item = ({ children }: { children: React.ReactNode }) => (
  <li className="flex flex-col gap-0.5 rounded-lg border p-3 text-base">{children}</li>
);

export function ReportView({ data }: { data: ReportData }) {
  const { timezone: tz, stats, range } = data;
  const show = (n: number | null) => (n === null ? "—" : String(n));
  const points = data.readings.map((r) => ({ t: r.measuredAt.getTime(), value: r.value }));

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold">Relatório de {data.ownerName}</h1>
        {data.patientSummary && <p className="text-lg">{data.patientSummary}</p>}
        <p className="text-base text-muted-foreground">
          {br(range.fromDate)} a {br(range.toDate)} · somente leitura
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="Média" value={show(stats.average)} hint={`${stats.count} medições`} />
        <StatCard label="Menor valor" value={show(stats.lowest)} />
        <StatCard label="Maior valor" value={show(stats.highest)} />
      </div>

      {points.length > 0 && (
        <GlucoseChart
          points={points}
          target={data.targets.geral ?? null}
          timezone={tz}
          summary={`Gráfico de glicemia de ${br(range.fromDate)} a ${br(range.toDate)}, média ${show(stats.average)} mg/dL.`}
        />
      )}

      <Section title="Medições de glicemia" empty={data.readings.length === 0}>
        <ul className="flex flex-col gap-2">
          {data.readings.map((r, i) => (
            <Item key={i}>
              <span className="font-semibold">{r.value} mg/dL · {STATUS_LABEL[r.status]}</span>
              <span>{formatDateTime(r.measuredAt, tz)} · {r.context}</span>
              {(r.symptoms || r.activity || r.notes) && (
                <span className="text-muted-foreground">{[r.symptoms, r.activity, r.notes].filter(Boolean).join(" · ")}</span>
              )}
            </Item>
          ))}
        </ul>
      </Section>

      <Section title="Refeições" empty={data.meals.length === 0}>
        <ul className="flex flex-col gap-2">
          {data.meals.map((m, i) => (
            <Item key={i}>
              <span className="font-semibold">{mealLabel(m.mealType, m.customType)} · {formatDateTime(m.eatenAt, tz)}</span>
              <span className="text-muted-foreground">{m.description}</span>
            </Item>
          ))}
        </ul>
      </Section>

      <Section title="Medicamentos" empty={data.medications.length === 0}>
        <ul className="flex flex-col gap-2">
          {data.medications.map((m, i) => (
            <Item key={i}>
              <span className="font-semibold">{m.name} · {m.dose} {m.unit}</span>
              <span>{formatDateTime(m.scheduledFor, tz)} · {m.status === "taken" ? "Tomou" : "Não tomou"}</span>
            </Item>
          ))}
        </ul>
      </Section>

      <Section title="Insulina" empty={data.insulin.length === 0}>
        <ul className="flex flex-col gap-2">
          {data.insulin.map((l, i) => (
            <Item key={i}>
              <span className="font-semibold">{formatUnits(l.units)} unidades · {l.typeName}</span>
              <span>{formatDateTime(l.appliedAt, tz)} · {relationLabel(l.mealRelation)}</span>
              {l.notes && <span className="text-muted-foreground">{l.notes}</span>}
            </Item>
          ))}
        </ul>
      </Section>

      <p className="text-sm text-muted-foreground">
        Faixas conforme metas configuradas pelo próprio paciente. Registros informados pelo usuário; não
        constitui diagnóstico nem substitui avaliação médica.
      </p>
    </div>
  );
}
