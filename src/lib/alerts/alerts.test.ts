import { describe, expect, it } from "vitest";
import { daysSummary, isDue, validateReminder } from "./reminders";
import { isOutsideRange, validateRange } from "./range";

describe("validateRange", () => {
  it("aceita faixa válida e ativa", () => {
    expect(validateRange({ enabled: "on", low: "70", high: "180" }).values).toEqual({ enabled: true, low: 70, high: 180 });
  });
  it("aceita tudo em branco com o aviso desligado (sem limites)", () => {
    expect(validateRange({ low: "", high: "" }).values).toEqual({ enabled: false, low: null, high: null });
  });
  it("não aceita ativar com campos vazios", () => {
    const r = validateRange({ enabled: "on", low: "", high: "" });
    expect(r.values).toBeUndefined();
    expect(r.errors.low).toBeTruthy();
    expect(r.errors.high).toBeTruthy();
  });
  it("exige os dois limites juntos", () => {
    expect(validateRange({ low: "70", high: "" }).errors.high).toBeTruthy();
  });
  it("recusa texto, decimais e fora de 20–600", () => {
    expect(validateRange({ low: "7a", high: "180" }).errors.low).toBeTruthy();
    expect(validateRange({ low: "70,5", high: "180" }).errors.low).toBeTruthy();
    expect(validateRange({ low: "10", high: "180" }).errors.low).toBeTruthy();
    expect(validateRange({ low: "70", high: "700" }).errors.high).toBeTruthy();
  });
  it("recusa inferior maior ou igual ao superior", () => {
    expect(validateRange({ low: "180", high: "70" }).errors.form).toBeTruthy();
    expect(validateRange({ low: "100", high: "100" }).errors.form).toBeTruthy();
  });
});

describe("isOutsideRange", () => {
  const on = { enabled: true, low: 70, high: 180 };
  it("avisa só fora dos limites configurados", () => {
    expect(isOutsideRange(69, on)).toBe(true);
    expect(isOutsideRange(181, on)).toBe(true);
    expect(isOutsideRange(70, on)).toBe(false);
    expect(isOutsideRange(180, on)).toBe(false);
    expect(isOutsideRange(120, on)).toBe(false);
  });
  it("nunca avisa com o recurso desligado, sem configuração ou incompleto", () => {
    expect(isOutsideRange(40, { ...on, enabled: false })).toBe(false);
    expect(isOutsideRange(400, { enabled: false, low: null, high: null })).toBe(false);
    expect(isOutsideRange(400, { enabled: true, low: 70, high: null })).toBe(false);
    expect(isOutsideRange(400, null)).toBe(false);
  });
});

describe("validateReminder", () => {
  const form = (entries: [string, string][]) => {
    const f = new FormData();
    for (const [k, v] of entries) f.append(k, v);
    return f;
  };
  it("lê horário, dias e fuso", () => {
    const r = validateReminder(form([["time", "08:30"], ["day", "2"], ["day", "4"], ["timezone", "America/Manaus"]]));
    expect(r.values).toEqual({ time: "08:30", daysMask: 6, timezone: "America/Manaus" });
  });
  it("recusa horário inválido, nenhum dia e fuso fora da lista", () => {
    expect(validateReminder(form([["time", "25:00"], ["day", "1"]])).error).toBeTruthy();
    expect(validateReminder(form([["time", "08:00"]])).error).toBeTruthy();
    expect(validateReminder(form([["time", "08:00"], ["day", "1"], ["timezone", "Mars/Base"]])).error).toBeTruthy();
    expect(validateReminder(form([["time", "08:00"], ["day", "999"]])).error).toBeTruthy();
  });
});

describe("isDue (horário local do usuário)", () => {
  // 2026-09-30 é quarta-feira. 11:00 UTC = 08:00 em Brasília e 07:00 em Manaus.
  const base = { daysMask: 127, enabled: true, lastSentOn: null as string | null };
  const now = new Date("2026-09-30T11:00:00Z");

  it("respeita o fuso do lembrete", () => {
    expect(isDue({ ...base, timeLocal: "08:00", timezone: "America/Sao_Paulo" }, now)).toBe(true);
    expect(isDue({ ...base, timeLocal: "08:00", timezone: "America/Manaus" }, now)).toBe(false);
    expect(isDue({ ...base, timeLocal: "07:00", timezone: "America/Manaus" }, now)).toBe(true);
  });
  it("não envia antes do horário nem depois da janela", () => {
    expect(isDue({ ...base, timeLocal: "08:30", timezone: "America/Sao_Paulo" }, now)).toBe(false);
    expect(isDue({ ...base, timeLocal: "05:00", timezone: "America/Sao_Paulo" }, now)).toBe(false);
  });
  it("respeita dias, pausa e envio já feito hoje", () => {
    const t = { timeLocal: "08:00", timezone: "America/Sao_Paulo" };
    expect(isDue({ ...base, ...t, daysMask: 0b0000100 }, now)).toBe(false); // só terça
    expect(isDue({ ...base, ...t, daysMask: 0b0001000 }, now)).toBe(true); // quarta
    expect(isDue({ ...base, ...t, enabled: false }, now)).toBe(false);
    expect(isDue({ ...base, ...t, lastSentOn: "2026-09-30" }, now)).toBe(false);
    expect(isDue({ ...base, ...t, lastSentOn: "2026-09-29" }, now)).toBe(true);
  });
});

describe("daysSummary", () => {
  it("resume a frequência", () => {
    expect(daysSummary(127)).toBe("Todos os dias");
    expect(daysSummary(0b0111110)).toBe("Segunda a sexta");
    expect(daysSummary(0b0000101)).toBe("Dom, Ter");
  });
});
