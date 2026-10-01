"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Props = {
  points: { t: number; value: number }[];
  target: { min: number; max: number } | null;
  timezone: string;
  summary: string;
};

export function GlucoseChart({ points, target, timezone, summary }: Props) {
  const day = new Intl.DateTimeFormat("pt-BR", { timeZone: timezone, day: "2-digit", month: "2-digit" });
  const full = new Intl.DateTimeFormat("pt-BR", {
    timeZone: timezone,
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  const values = points.map((p) => p.value);
  const lo = Math.min(...values, target?.min ?? Infinity);
  const hi = Math.max(...values, target?.max ?? -Infinity);

  return (
    <div role="img" aria-label={summary} className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          {target && (
            <ReferenceArea y1={target.min} y2={target.max} fill="var(--color-ok)" fillOpacity={0.16} ifOverflow="extendDomain" />
          )}
          <XAxis
            dataKey="t"
            type="number"
            scale="time"
            domain={["dataMin", "dataMax"]}
            tickFormatter={(v: number) => day.format(v)}
            tickCount={5}
            fontSize={14}
          />
          <YAxis
            domain={[Math.max(0, Math.floor((lo - 20) / 10) * 10), Math.ceil((hi + 20) / 10) * 10]}
            width={44}
            fontSize={14}
          />
          <Tooltip
            labelFormatter={(v) => full.format(Number(v))}
            formatter={(v) => [`${v} mg/dL`, "Glicemia"]}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="var(--color-primary)"
            strokeWidth={3}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
