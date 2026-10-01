import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const send = vi.fn();
vi.mock("resend", () => ({ Resend: class { emails = { send: (...a: unknown[]) => send(...a) }; } }));

import { resolveFrom, sendEmail } from "./email";

let errorSpy: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  vi.stubEnv("RESEND_API_KEY", "re_test");
  vi.stubEnv("EMAIL_FROM", "Glicose Tech <avisos@dominio.com>");
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe("sendEmail", () => {
  it("sem chave, não envia nem registra nada", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    expect(await sendEmail("a@b.com", "x", "<p>y</p>")).toBe(false);
    expect(send).not.toHaveBeenCalled();
  });

  it("envia com o remetente configurado", async () => {
    send.mockResolvedValue({ error: null });
    expect(await sendEmail("paciente@example.com", "Assunto", "<p>corpo</p>")).toBe(true);
    expect(send.mock.calls[0][0]).toMatchObject({ from: "Glicose Tech <avisos@dominio.com>", to: "paciente@example.com" });
  });

  it("recusa do Resend: devolve false e registra o motivo, SEM destinatário, assunto nem corpo", async () => {
    send.mockResolvedValue({ error: { name: "validation_error", statusCode: 403, message: "The dominio.com domain is not verified." } });
    expect(await sendEmail("paciente.secreto@example.com", "Glicemia alta de Maria", "<p>180 mg/dL</p>")).toBe(false);
    const logged = errorSpy.mock.calls.map((c: unknown[]) => String(c[0])).join(" ");
    expect(logged).toContain("403");
    expect(logged).toContain("domain is not verified");
    expect(logged).not.toContain("paciente.secreto");
    expect(logged).not.toContain("Glicemia alta");
    expect(logged).not.toContain("180");
  });

  it("falha de rede: devolve false sem vazar dados", async () => {
    send.mockRejectedValue(new TypeError("fetch failed para paciente.secreto@example.com"));
    expect(await sendEmail("paciente.secreto@example.com", "s", "h")).toBe(false);
    expect(errorSpy.mock.calls.map((c: unknown[]) => String(c[0])).join(" ")).not.toContain("paciente.secreto");
  });
});

describe("resolveFrom", () => {
  it("usa o configurado, ignora aspas e espaços, e cai no remetente de teste se vazio", () => {
    expect(resolveFrom("Glicose Tech <a@b.com>")).toBe("Glicose Tech <a@b.com>");
    expect(resolveFrom('"Glicose Tech <a@b.com>"')).toBe("Glicose Tech <a@b.com>");
    expect(resolveFrom("  ")).toBe("Glicose Tech <onboarding@resend.dev>");
    expect(resolveFrom(undefined)).toBe("Glicose Tech <onboarding@resend.dev>");
  });
});
