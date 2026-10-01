import { describe, expect, it } from "vitest";
import { csvCell, toCsv } from "./csv";

describe("csv", () => {
  it("neutraliza fórmulas e escapa aspas", () => {
    expect(csvCell("=HYPERLINK(1)")).toBe("'=HYPERLINK(1)");
    expect(csvCell('diz "oi"')).toBe('"diz ""oi"""');
    expect(csvCell(-5)).toBe("-5");
    expect(csvCell(null)).toBe("");
  });
  it("monta linhas", () => {
    expect(toCsv(["a", "b"], [[1, "x,y"]])).toBe('a,b\r\n1,"x,y"');
  });
});
