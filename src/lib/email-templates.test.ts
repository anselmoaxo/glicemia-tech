import { describe, expect, it } from "vitest";
import { resetPasswordEmail, verificationEmail } from "./email-templates";

describe("e-mails transacionais", () => {
  it("verificação: traz o link, o primeiro nome e a validade", () => {
    const m = verificationEmail("Maria da Silva", "https://app.test/api/auth/verify-email?token=abc&callbackURL=%2Finicio");
    expect(m.subject).toMatch(/Confirme/);
    expect(m.html).toContain("Olá, Maria!");
    expect(m.html).toContain("verify-email?token=abc&amp;callbackURL=%2Finicio"); // & escapado no HTML
    expect(m.html).toMatch(/24 horas/);
  });

  it("redefinição: traz o link e avisa que pode ser ignorado", () => {
    const m = resetPasswordEmail("João", "https://app.test/reset?token=xyz");
    expect(m.subject).toMatch(/senha/i);
    expect(m.html).toContain("token=xyz");
    expect(m.html).toMatch(/ignore esta mensagem/i);
    expect(m.html).toMatch(/60 minutos/);
  });

  it("escapa HTML no nome e no link (sem injeção)", () => {
    const m = verificationEmail('<script>alert(1)</script> Hacker', 'https://x.test/?a="><img src=x onerror=1>');
    expect(m.html).not.toContain("<script>");
    expect(m.html).not.toContain('"><img');
    expect(m.html).toContain("&lt;script&gt;");
  });
});
