import { describe, expect, it } from "vitest";
import { firstErrorKey, validateTargets } from "./targets";

const blank = { geral_min: "", geral_max: "", jejum_min: "", jejum_max: "", pos_refeicao_min: "", pos_refeicao_max: "" };

describe("validateTargets", () => {
  it("aceita faixas completas e remove as em branco", () => {
    const r = validateTargets({ ...blank, geral_min: "70", geral_max: "180", jejum_min: " 70 ", jejum_max: "100" });
    expect(r.errors).toEqual({});
    expect(r.values).toEqual({ geral: { min: 70, max: 180 }, jejum: { min: 70, max: 100 } });
    expect(r.clear).toEqual(["pos_refeicao"]);
  });

  it("tudo em branco não é erro: só limpa", () => {
    const r = validateTargets(blank);
    expect(r.errors).toEqual({});
    expect(r.clear).toHaveLength(3);
  });

  it("aponta o erro na faixa certa", () => {
    expect(validateTargets({ ...blank, geral_min: "70" }).errors.geral).toMatch(/mínimo e o máximo/);
    expect(validateTargets({ ...blank, jejum_min: "100", jejum_max: "70" }).errors.jejum).toMatch(/menor que o máximo/);
    expect(validateTargets({ ...blank, jejum_min: "80", jejum_max: "80" }).errors.jejum).toMatch(/menor que o máximo/);
    expect(validateTargets({ ...blank, pos_refeicao_min: "10", pos_refeicao_max: "900" }).errors.pos_refeicao).toMatch(/entre 20 e 600/);
  });

  it("rejeita texto, decimais, vírgula e sinais", () => {
    for (const bad of ["abc", "70.5", "70,5", "-70", "7e1", "+70"]) {
      expect(validateTargets({ ...blank, geral_min: bad, geral_max: "180" }).errors.geral).toMatch(/inteiros/);
    }
  });

  it("ignora campos desconhecidos e valores que não são texto", () => {
    const r = validateTargets({ ...blank, $ACTION_ID: "x", geral_min: 70, geral_max: {} });
    expect(r.errors).toEqual({}); // números/objetos viram em branco
    expect(r.values).toEqual({});
  });

  it("firstErrorKey segue a ordem da tela", () => {
    expect(firstErrorKey({ jejum: "x", pos_refeicao: "y" })).toBe("jejum");
    expect(firstErrorKey({})).toBeNull();
  });
});
