import { describe, expect, it } from "vitest";
import { buildRange } from "./range";
import { renderReportPdf } from "./pdf";
import type { ReportData } from "./data";

const range = buildRange("2026-03-01", "2026-03-07", "America/Sao_Paulo");

const data: ReportData = {
  ownerName: "Maria da Silva",
  timezone: "America/Sao_Paulo",
  range,
  targets: { geral: { min: 70, max: 180 } },
  stats: { count: 2, average: 140, lowest: 100, highest: 180 },
  readings: [
    { value: 100, measuredAt: new Date("2026-03-02T10:00:00Z"), contextKey: "jejum", customLabel: null, notes: "Ação", symptoms: null, activity: null, context: "Jejum", status: "in_range" },
    { value: 180, measuredAt: new Date("2026-03-03T15:00:00Z"), contextKey: "apos_2h", customLabel: null, notes: null, symptoms: null, activity: null, context: "2h após refeição", status: "in_range" },
  ],
  meals: [{ mealType: "almoco", customType: null, eatenAt: new Date("2026-03-02T15:00:00Z"), description: "Arroz, feijão e salada" }],
  medications: [{ name: "Metformina", dose: "500", unit: "mg", scheduledFor: new Date("2026-03-02T11:00:00Z"), status: "taken" }],
  insulin: [{ units: "10.0", appliedAt: new Date("2026-03-02T10:30:00Z"), mealRelation: "antes_refeicao", site: "abdomen", notes: null, typeName: "NPH" }],
};

describe("relatório em PDF", () => {
  it("gera um PDF válido", async () => {
    const buffer = await renderReportPdf(data);
    expect(buffer.subarray(0, 5).toString()).toBe("%PDF-");
    expect(buffer.length).toBeGreaterThan(1500);
  });
  it("gera mesmo sem registros", async () => {
    const empty = { ...data, readings: [], meals: [], medications: [], insulin: [], stats: { count: 0, average: null, lowest: null, highest: null } };
    const buffer = await renderReportPdf(empty);
    expect(buffer.subarray(0, 5).toString()).toBe("%PDF-");
  });
});
