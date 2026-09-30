import { describe, expect, it } from "vitest";
import { gaugeGeometry } from "./gauge";

describe("gaugeGeometry", () => {
  it("valor dentro da faixa fica dentro da banda", () => {
    const g = gaugeGeometry(110, { min: 70, max: 180 });
    const band = g.band!;
    expect(g.marker).toBeGreaterThan(band.left);
    expect(g.marker).toBeLessThan(band.left + band.width);
  });
  it("valor alto fica à direita da banda, baixo à esquerda", () => {
    const hi = gaugeGeometry(250, { min: 70, max: 180 });
    expect(hi.marker).toBeGreaterThan(hi.band!.left + hi.band!.width);
    const lo = gaugeGeometry(50, { min: 70, max: 180 });
    expect(lo.marker).toBeLessThan(lo.band!.left);
  });
  it("sem meta não há banda e tudo fica entre 0 e 100", () => {
    const g = gaugeGeometry(120, null);
    expect(g.band).toBeNull();
    expect(g.marker).toBeGreaterThanOrEqual(0);
    expect(g.marker).toBeLessThanOrEqual(100);
  });
});
