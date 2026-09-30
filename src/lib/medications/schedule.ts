import { localToDate } from "@/lib/datetime";

export const WEEKDAYS = [
  { value: 0, short: "Dom", long: "domingo" },
  { value: 1, short: "Seg", long: "segunda" },
  { value: 2, short: "Ter", long: "terça" },
  { value: 3, short: "Qua", long: "quarta" },
  { value: 4, short: "Qui", long: "quinta" },
  { value: 5, short: "Sex", long: "sexta" },
  { value: 6, short: "Sáb", long: "sábado" },
] as const;

export const UNITS = ["mg", "mcg", "g", "ml", "comprimido(s)", "gota(s)", "unidade(s)"] as const;

export type ScheduleRow = { id: string; medicationId: string; time: string; daysOfWeek: number[] };
export type Dose = { scheduleId: string; medicationId: string; time: string; scheduledFor: Date };

/** Dia da semana (0 = domingo) de uma data local YYYY-MM-DD. */
export function weekdayOf(date: string) {
  return new Date(`${date}T12:00:00Z`).getUTCDay();
}

function nextDate(date: string) {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

/** Intervalo [from, to) em UTC correspondente ao dia local. */
export function dayRange(date: string, tz: string) {
  return { from: localToDate(date, "00:00", tz), to: localToDate(nextDate(date), "00:00", tz) };
}

/** Doses previstas para um dia local, ordenadas por horário. */
export function dosesForDay(rows: ScheduleRow[], date: string, tz: string): Dose[] {
  const wd = weekdayOf(date);
  return rows
    .filter((r) => r.daysOfWeek.includes(wd))
    .map((r) => {
      const time = r.time.slice(0, 5);
      return {
        scheduleId: r.id,
        medicationId: r.medicationId,
        time,
        scheduledFor: localToDate(date, time, tz),
      };
    })
    .sort((a, b) => a.scheduledFor.getTime() - b.scheduledFor.getTime());
}

export function summarizeSchedule(rows: Pick<ScheduleRow, "time" | "daysOfWeek">[]) {
  if (rows.length === 0) return "Sem horários";
  const times = rows.map((r) => r.time.slice(0, 5)).sort();
  const days = [...new Set(rows.flatMap((r) => r.daysOfWeek))].sort();
  const dayText =
    days.length === 7
      ? "todos os dias"
      : days.map((d) => WEEKDAYS[d].short).join(", ");
  return `${times.length}× ao dia (${times.join(", ")}) · ${dayText}`;
}
