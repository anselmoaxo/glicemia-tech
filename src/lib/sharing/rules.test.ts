import { describe, expect, it } from "vitest";
import {
  isMinor,
  isStale,
  majorityStatus,
  registeredLater,
  reportSections,
  sharingAuthority,
} from "./rules";

const now = new Date("2026-10-03T12:00:00");

describe("quem administra o compartilhamento", () => {
  it("adulto controla tudo, inclusive revogar o antigo responsável", () => {
    const a = sharingAuthority("owner", false);
    expect([a.canView, a.canInvite, a.canEditPermissions]).toEqual([true, true, true]);
    expect(a.canRevoke("companion")).toBe(true);
    expect(a.canRevoke("guardian")).toBe(true);
  });

  it("menor vê e pode reduzir o compartilhamento, mas não convida, não amplia e não revoga o responsável", () => {
    const a = sharingAuthority("owner", true);
    expect(a.canView).toBe(true);
    expect(a.canInvite).toBe(false);
    expect(a.canEditPermissions).toBe(false);
    expect(a.canRevoke("companion")).toBe(true);
    expect(a.canRevoke("guardian")).toBe(false);
  });

  it("responsável de menor convida, ajusta e revoga acompanhantes, mas não outro responsável", () => {
    const a = sharingAuthority("guardian", true);
    expect([a.canView, a.canInvite, a.canEditPermissions]).toEqual([true, true, true]);
    expect(a.canRevoke("companion")).toBe(true);
    expect(a.canRevoke("guardian")).toBe(false);
  });

  it("responsável perde a administração quando o titular é adulto", () => {
    const a = sharingAuthority("guardian", false);
    expect([a.canView, a.canInvite, a.canEditPermissions, a.canRevoke("companion")]).toEqual([false, false, false, false]);
  });

  it("acompanhante comum (ou qualquer outra pessoa) não administra nada nem repassa acesso", () => {
    for (const minor of [true, false]) {
      const a = sharingAuthority("none", minor);
      expect([a.canView, a.canInvite, a.canEditPermissions, a.canRevoke("companion"), a.canRevoke("guardian")]).toEqual([
        false, false, false, false, false,
      ]);
    }
  });
});

describe("menoridade e maioridade", () => {
  it("sem data de nascimento não presume menoridade", () => {
    expect(isMinor(null, now)).toBe(false);
    expect(majorityStatus(null, now)).toEqual({ kind: "unknown" });
  });

  it("menor longe dos 18, perto dos 18 e adulto", () => {
    expect(majorityStatus("2012-05-01", now).kind).toBe("minor");
    expect(majorityStatus("2008-11-02", now)).toEqual({ kind: "soon", daysTo18: 30 });
    expect(majorityStatus("2008-10-04", now)).toEqual({ kind: "soon", daysTo18: 1 });
    expect(majorityStatus("2008-10-03", now)).toEqual({ kind: "adult" });
    expect(isMinor("2008-10-04", now)).toBe(true);
    expect(isMinor("2008-10-03", now)).toBe(false);
  });
});

describe("dados antigos e horários", () => {
  it("registro com mais de 24 h não é atual", () => {
    expect(isStale(new Date("2026-10-03T08:00:00"), now)).toBe(false);
    expect(isStale(new Date("2026-10-02T11:00:00"), now)).toBe(true);
    expect(isStale(null, now)).toBe(true);
  });

  it("registro feito bem depois da medição é identificado", () => {
    const measured = new Date("2026-10-03T07:00:00");
    expect(registeredLater(measured, new Date("2026-10-03T07:05:00"))).toBe(false);
    expect(registeredLater(measured, new Date("2026-10-03T10:00:00"))).toBe(true);
  });
});

describe("relatório do acompanhante", () => {
  it("inclui só as seções dos módulos liberados", () => {
    expect(reportSections(new Set(["reports", "glucose"]))).toEqual({ glucose: true, meals: false, medications: false, insulin: false });
    expect(reportSections(new Set(["reports"]))).toEqual({ glucose: false, meals: false, medications: false, insulin: false });
  });
});
