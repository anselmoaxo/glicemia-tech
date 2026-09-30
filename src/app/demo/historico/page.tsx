import { formatDateTime } from "@/lib/datetime";
import { OUT_OF_RANGE_MESSAGE, STATUS_LABEL, type GlucoseStatus } from "@/lib/glucose/classify";
import { contextLabel } from "@/lib/glucose/contexts";
import { mockReadings, TZ } from "../mock";

const style: Record<GlucoseStatus, string> = {
  low: "border-low/30 bg-low-soft text-low",
  high: "border-high/30 bg-high-soft text-high",
  in_range: "border-ok/30 bg-ok-soft text-ok",
  no_target: "border-border bg-muted text-muted-foreground",
};

export default function DemoHistorico() {
  const readings = mockReadings().reverse();
  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold">Glicemia</h1>
      <ul className="flex flex-col gap-4">
        {readings.map((r) => (
          <li key={r.id} className="flex flex-col gap-2 rounded-2xl border bg-card p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-3xl font-bold">
                {r.value} <span className="text-base font-normal text-muted-foreground">mg/dL</span>
              </p>
              <span className={`rounded-full border-2 px-3 py-1 text-sm font-semibold ${style[r.status]}`}>
                {STATUS_LABEL[r.status]}
              </span>
            </div>
            <p className="text-base">{formatDateTime(r.measuredAt, TZ)} · {contextLabel(r.contextKey)}</p>
            {(r.status === "low" || r.status === "high") && (
              <p className="text-sm text-muted-foreground">{OUT_OF_RANGE_MESSAGE}</p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
