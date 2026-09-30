import "server-only";
import { Document, Line, Page, Polyline, Rect, StyleSheet, Svg, Text, View, renderToBuffer } from "@react-pdf/renderer";
import { STATUS_LABEL } from "@/lib/glucose/classify";
import { formatUnits, relationLabel, siteLabel } from "@/lib/insulin/options";
import { mealLabel } from "@/lib/meals/types";
import type { ReportData } from "./data";

const s = StyleSheet.create({
  page: { padding: 32, fontSize: 9, fontFamily: "Helvetica", color: "#111" },
  h1: { fontSize: 18, fontFamily: "Helvetica-Bold", marginBottom: 2 },
  h2: { fontSize: 12, fontFamily: "Helvetica-Bold", marginTop: 14, marginBottom: 4 },
  muted: { color: "#555" },
  cards: { flexDirection: "row", gap: 8, marginTop: 8 },
  card: { flexGrow: 1, borderWidth: 1, borderColor: "#bbb", padding: 6 },
  cardValue: { fontSize: 14, fontFamily: "Helvetica-Bold" },
  row: { flexDirection: "row", borderBottomWidth: 0.5, borderColor: "#ccc", paddingVertical: 2 },
  head: { fontFamily: "Helvetica-Bold", backgroundColor: "#eee" },
  note: { fontSize: 7.5, color: "#555", marginTop: 14 },
});

const fmt = (d: Date, tz: string) =>
  new Intl.DateTimeFormat("pt-BR", {
    timeZone: tz,
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);

const br = (iso: string) => iso.split("-").reverse().join("/");

function Table({ cols, widths, rows }: { cols: string[]; widths: string[]; rows: string[][] }) {
  return (
    <View>
      <View style={[s.row, s.head]} fixed>
        {cols.map((c, i) => (
          <Text key={c} style={{ width: widths[i], paddingHorizontal: 2 }}>{c}</Text>
        ))}
      </View>
      {rows.map((r, i) => (
        <View key={i} style={s.row} wrap={false}>
          {r.map((cell, j) => (
            <Text key={j} style={{ width: widths[j], paddingHorizontal: 2 }}>{cell}</Text>
          ))}
        </View>
      ))}
      {rows.length === 0 && <Text style={s.muted}>Sem registros no período.</Text>}
    </View>
  );
}

function Chart({ data }: { data: ReportData }) {
  const pts = data.readings;
  if (pts.length < 2) return null;
  const W = 520;
  const H = 140;
  const g = data.targets.geral;
  const values = pts.map((p) => p.value);
  const lo = Math.min(...values, g?.min ?? Infinity) - 10;
  const hi = Math.max(...values, g?.max ?? -Infinity) + 10;
  const t0 = pts[0].measuredAt.getTime();
  const span = Math.max(1, pts[pts.length - 1].measuredAt.getTime() - t0);
  const x = (t: number) => ((t - t0) / span) * (W - 10) + 5;
  const y = (v: number) => H - 5 - ((v - lo) / (hi - lo)) * (H - 10);
  const line = pts.map((p) => `${x(p.measuredAt.getTime()).toFixed(1)},${y(p.value).toFixed(1)}`).join(" ");

  return (
    <View>
      <Svg width={W} height={H} style={{ borderWidth: 0.5, borderColor: "#999" }}>
        {g && <Rect x={0} y={y(g.max)} width={W} height={y(g.min) - y(g.max)} fill="#dcfce7" />}
        <Line x1={0} y1={H - 1} x2={W} y2={H - 1} stroke="#999" strokeWidth={0.5} />
        <Polyline points={line} fill="none" stroke="#1d4ed8" strokeWidth={1.5} />
      </Svg>
      <Text style={[s.muted, { fontSize: 7.5, marginTop: 2 }]}>
        Escala de {Math.round(lo)} a {Math.round(hi)} mg/dL{g ? `; faixa verde: meta geral ${g.min}–${g.max} mg/dL` : ""}.
      </Text>
    </View>
  );
}

export function ReportDocument({ data }: { data: ReportData }) {
  const { timezone: tz, stats, range } = data;
  const show = (n: number | null) => (n === null ? "—" : `${n}`);

  return (
    <Document title={`Relatório de glicemia - ${data.ownerName}`}>
      <Page size="A4" style={s.page}>
        <Text style={s.h1}>Relatório de acompanhamento</Text>
        <Text>{data.ownerName}</Text>
        <Text style={s.muted}>Período: {br(range.fromDate)} a {br(range.toDate)} ({range.days} dias)</Text>

        <View style={s.cards}>
          {[
            ["Média (mg/dL)", show(stats.average)],
            ["Menor (mg/dL)", show(stats.lowest)],
            ["Maior (mg/dL)", show(stats.highest)],
            ["Medições", `${stats.count}`],
          ].map(([label, value]) => (
            <View key={label} style={s.card}>
              <Text style={s.muted}>{label}</Text>
              <Text style={s.cardValue}>{value}</Text>
            </View>
          ))}
        </View>

        <Text style={s.h2}>Gráfico de glicemia</Text>
        {data.readings.length < 2 ? <Text style={s.muted}>Medições insuficientes para o gráfico.</Text> : <Chart data={data} />}

        <Text style={s.h2}>Medições de glicemia</Text>
        <Table
          cols={["Data/hora", "mg/dL", "Contexto", "Faixa*", "Observações"]}
          widths={["20%", "9%", "22%", "17%", "32%"]}
          rows={data.readings.map((r) => [
            fmt(r.measuredAt, tz),
            `${r.value}`,
            r.context,
            STATUS_LABEL[r.status],
            [r.symptoms, r.activity, r.notes].filter(Boolean).join(" · "),
          ])}
        />

        <Text style={s.h2}>Refeições</Text>
        <Table
          cols={["Data/hora", "Refeição", "Descrição"]}
          widths={["20%", "20%", "60%"]}
          rows={data.meals.map((m) => [fmt(m.eatenAt, tz), mealLabel(m.mealType, m.customType), m.description])}
        />

        <Text style={s.h2}>Medicamentos</Text>
        <Table
          cols={["Horário previsto", "Medicamento", "Dose", "Resposta"]}
          widths={["22%", "38%", "20%", "20%"]}
          rows={data.medications.map((m) => [
            fmt(m.scheduledFor, tz),
            m.name,
            `${m.dose} ${m.unit}`,
            m.status === "taken" ? "Tomou" : "Não tomou",
          ])}
        />

        <Text style={s.h2}>Insulina</Text>
        <Table
          cols={["Data/hora", "Tipo", "Unidades", "Relação", "Local / obs."]}
          widths={["20%", "18%", "12%", "25%", "25%"]}
          rows={data.insulin.map((l) => [
            fmt(l.appliedAt, tz),
            l.typeName,
            formatUnits(l.units),
            relationLabel(l.mealRelation),
            [siteLabel(l.site), l.notes].filter(Boolean).join(" · "),
          ])}
        />

        <Text style={s.note}>
          * Faixa conforme metas configuradas pelo próprio paciente no aplicativo. Este relatório organiza
          registros informados pelo usuário; não constitui diagnóstico, não sugere doses e não substitui
          avaliação médica.
        </Text>
      </Page>
    </Document>
  );
}

export async function renderReportPdf(data: ReportData) {
  return renderToBuffer(<ReportDocument data={data} />);
}
