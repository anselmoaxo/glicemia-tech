import { describe, expect, it } from "vitest";
import { maskEmail } from "@/lib/privacy/mask";
import { dayEnabled, isMissed, slotsForDay } from "./slots";
import { diabetesControlsVisible } from "./visibility";

describe("visibilidade dos controles de diabetes", () => {
  it("esconde para quem marcou que não tem diabetes, salvo acompanhamento específico", () => {
    expect(diabetesControlsVisible("sem_diabetes", false)).toBe(false);
    expect(diabetesControlsVisible("sem_diabetes", true)).toBe(true);
    expect(diabetesControlsVisible("diabetes", false)).toBe(true);
    expect(diabetesControlsVisible(null, false)).toBe(true);
  });
});

describe("medição prevista sem registro", () => {
  const tz = "America/Sao_Paulo";
  const [slot] = slotsForDay("2026-10-01", ["07:30"], tz);
  const at = (min: number) => new Date(slot.at.getTime() + min * 60_000);
  it("só avisa depois do horário e da tolerância", () => {
    expect(isMissed(slot.at, 30, at(10), [])).toBe(false);
    expect(isMissed(slot.at, 30, at(29), [])).toBe(false);
    expect(isMissed(slot.at, 30, at(31), [])).toBe(true);
  });
  it("não avisa se houve registro perto do horário", () => {
    expect(isMissed(slot.at, 30, at(40), [at(-20)])).toBe(false);
    expect(isMissed(slot.at, 30, at(40), [at(35)])).toBe(false);
  });
  it("não avisa muito tarde", () => {
    expect(isMissed(slot.at, 30, at(400), [])).toBe(false);
  });
  it("respeita os dias escolhidos (quinta = bit 16)", () => {
    expect(dayEnabled(16, "2026-10-01")).toBe(true);
    expect(dayEnabled(2, "2026-10-01")).toBe(false);
    expect(dayEnabled(null, "2026-10-01")).toBe(true);
  });
});

describe("e-mail mascarado", () => {
  it("mostra só a primeira letra", () => {
    expect(maskEmail("Anselmo@Dominio.com")).toBe("a***@dominio.com");
    expect(maskEmail("sem-arroba")).toBe("***");
  });
});
