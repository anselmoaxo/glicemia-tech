import { describe, expect, it } from "vitest";
import { dateToLocalInputs, localToDate } from "./datetime";

describe("datetime", () => {
  it("converte horário de Brasília para UTC e volta", () => {
    const d = localToDate("2026-03-10", "07:30", "America/Sao_Paulo");
    expect(d.toISOString()).toBe("2026-03-10T10:30:00.000Z");
    expect(dateToLocalInputs(d, "America/Sao_Paulo")).toEqual({ date: "2026-03-10", time: "07:30" });
  });
});
