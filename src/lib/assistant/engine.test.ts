import { describe, expect, it } from "vitest";
import { answer, OUT_OF_SCOPE } from "./engine";

describe("assistente", () => {
  it("recusa assunto fora do escopo com a mensagem fixa", () => {
    expect(answer("Quem ganhou o jogo ontem?")).toEqual({ kind: "out_of_scope", text: OUT_OF_SCOPE });
    expect(answer("me ajuda com uma receita de bolo?").kind).not.toBe("carbs");
  });
  it("não calcula dose nem altera medicamento", () => {
    expect(answer("Quantas unidades de insulina devo tomar com 60g de carboidrato?").kind).toBe("dose");
    expect(answer("posso parar a metformina?").kind).toBe("dose");
  });
  it("encaminha urgência para atendimento", () => {
    const r = answer("meu pai desmaiou e a glicose está baixa");
    expect(r.kind).toBe("emergency");
    expect(r.text).toContain("192");
  });
  it("pergunta a quantidade quando falta", () => {
    const r = answer("quantos carboidratos tem o arroz?");
    expect(r.kind).toBe("ask");
    expect(r.pendingFood).toBe("arroz_branco");
    const next = answer("150 g", { pendingFood: r.pendingFood });
    expect(next.kind).toBe("carbs");
    expect(next.text).toContain("42 g");
  });
  it("estima por unidades e pede conferência do rótulo", () => {
    const r = answer("2 pães franceses");
    expect(r.kind).toBe("carbs");
    expect(r.text).toContain("58 g");
    expect(r.text).toMatch(/rótulo/);
  });
  it("soma uma refeição", () => {
    const r = answer("100g de arroz, 80g de feijão e 1 banana");
    expect(r.kind).toBe("carbs");
    expect(r.text).toContain("Total estimado");
  });
  it("não estima alimento cru ou frito", () => {
    expect(answer("200g de batata frita").kind).toBe("ask");
  });
  it("responde conceitos educativos com aviso", () => {
    const r = answer("o que é hemoglobina glicada?");
    expect(r.kind).toBe("faq");
    expect(r.text).toContain("Não substitui");
  });
});
