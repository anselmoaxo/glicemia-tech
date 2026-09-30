import { describe, expect, it } from "vitest";
import { dayRange, dosesForDay, summarizeSchedule, weekdayOf } from "./schedule";

const tz = "America/Sao_Paulo";
const rows = [
  { id: "a", medicationId: "m1", time: "20:00:00", daysOfWeek: [0, 1, 2, 3, 4, 5, 6] },
  { id: "b", medicationId: "m1", time: "08:00:00", daysOfWeek: [1, 3] },
];

describe("schedule", () => {
  it("calcula o dia da semana", () => {
    expect(weekdayOf("2026-03-09")).toBe(1); // segunda
  });
  it("filtra por dia da semana e ordena por horário", () => {
    const seg = dosesForDay(rows, "2026-03-09", tz);
    expect(seg.map((d) => d.time)).toEqual(["08:00", "20:00"]);
    expect(seg[0].scheduledFor.toISOString()).toBe("2026-03-09T11:00:00.000Z");
    expect(dosesForDay(rows, "2026-03-10", tz).map((d) => d.time)).toEqual(["20:00"]);
  });
  it("intervalo do dia local", () => {
    const r = dayRange("2026-03-09", tz);
    expect(r.from.toISOString()).toBe("2026-03-09T03:00:00.000Z");
    expect(r.to.toISOString()).toBe("2026-03-10T03:00:00.000Z");
  });
  it("resume a agenda", () => {
    expect(summarizeSchedule([rows[0]])).toBe("1× ao dia (20:00) · todos os dias");
    expect(summarizeSchedule([rows[1]])).toBe("1× ao dia (08:00) · Seg, Qua");
  });
});
