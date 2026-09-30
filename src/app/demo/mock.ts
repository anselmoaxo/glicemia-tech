import { classify, type GlucoseStatus } from "@/lib/glucose/classify";

export const TZ = "America/Sao_Paulo";
export const TARGETS = { geral: { min: 70, max: 180 }, jejum: { min: 70, max: 100 } };

const H = 60 * 60 * 1000;
const values: [number, string, number][] = [
  [98, "jejum", 7 * 24 + 1],
  [142, "apos_2h", 6 * 24 + 15],
  [110, "antes_refeicao", 6 * 24 + 5],
  [95, "jejum", 5 * 24 + 1],
  [188, "apos_1h", 4 * 24 + 18],
  [104, "antes_dormir", 4 * 24 + 4],
  [92, "jejum", 3 * 24 + 1],
  [156, "apos_2h", 2 * 24 + 16],
  [62, "antes_refeicao", 2 * 24 + 6],
  [101, "jejum", 1 * 24 + 1],
  [133, "apos_2h", 1 * 24 - 3],
  [97, "jejum", 1],
];

/** Medições fictícias relativas a agora, da mais antiga para a mais recente. */
export function mockReadings(now = new Date()) {
  return values.map(([value, contextKey, hoursAgo], i) => ({
    id: String(i),
    value,
    contextKey,
    measuredAt: new Date(now.getTime() - hoursAgo * H),
    status: classify(value, contextKey, TARGETS) as GlucoseStatus,
  }));
}
