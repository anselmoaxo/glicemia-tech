import { describe, expect, it } from "vitest";
import { classify } from "./classify";

const targets = { geral: { min: 70, max: 180 }, jejum: { min: 70, max: 100 } };

describe("classify", () => {
  it("usa a faixa do contexto e cai na geral", () => {
    expect(classify(110, "jejum", targets)).toBe("high");
    expect(classify(110, "aleatoria", targets)).toBe("in_range");
    expect(classify(110, "apos_2h", targets)).toBe("in_range");
  });
  it("limites são inclusivos", () => {
    expect(classify(70, "jejum", targets)).toBe("in_range");
    expect(classify(100, "jejum", targets)).toBe("in_range");
    expect(classify(69, "jejum", targets)).toBe("low");
  });
  it("sem faixa definida", () => {
    expect(classify(100, "jejum", {})).toBe("no_target");
  });
});
