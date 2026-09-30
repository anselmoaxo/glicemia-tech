import { describe, expect, it } from "vitest";
import { computeStats } from "./stats";

describe("computeStats", () => {
  it("calcula média, mínimo e máximo", () => {
    expect(computeStats([100, 150, 200])).toEqual({ count: 3, average: 150, lowest: 100, highest: 200 });
  });
  it("lista vazia", () => {
    expect(computeStats([])).toEqual({ count: 0, average: null, lowest: null, highest: null });
  });
});
