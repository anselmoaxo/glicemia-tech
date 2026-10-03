import { describe, expect, it } from "vitest";
import { alertEmail, resetPasswordEmail, twoFactorCodeEmail, verificationEmail } from "./email-templates";

const APP = "https://app.test";

const all = () => [
  verificationEmail({ name: "Maria da Silva", url: `${APP}/api/auth/verify-email?token=abc&callbackURL=%2Fx`, appUrl: APP }),
  resetPasswordEmail({ name: "Maria da Silva", url: `${APP}/reset?token=xyz`, appUrl: APP }),
  alertEmail({ value: 212, direction: "high", appUrl: APP, link: `${APP}/glicemia`, details: true }),
  alertEmail({ value: 54, direction: "low", appUrl: APP, ownerName: "João", link: `${APP}/familia/u1`, details: true }),
  twoFactorCodeEmail({ name: "Maria", code: "123456", appUrl: APP }),
];

describe("estrutura comum dos e-mails", () => {
  it.each(all().map((m, i) => [i, m] as const))("e-mail %i: acessível, com texto puro e dentro do limite do Gmail", (_i, m) => {
    expect(m.html).toContain('lang="pt-BR"');
    expect(m.html).toContain('name="color-scheme"'); // modo escuro
    expect(m.html).toContain("max-width:560px"); // encolhe no celular
    expect(m.html).toContain("prefers-color-scheme: dark");
    expect(m.html.length).toBeLessThan(100_000); // o Gmail corta mensagens acima de ~102 KB
    expect(m.text.length).toBeGreaterThan(40);
    expect(m.text).not.toMatch(/<[a-z]+/i); // sem HTML no texto puro
    expect(m.html).not.toMatch(/<script|javascript:/i);
    expect(m.subject.length).toBeGreaterThan(5);
    expect(m.subject.length).toBeLessThan(80);
  });

  it("mostra o endereço do botão por extenso (para quem não consegue tocar)", () => {
    for (const m of [all()[0], all()[1]]) {
      const hrefs = [...m.html.matchAll(/href="([^"]+)"/g)].map((x) => x[1]);
      const link = hrefs.find((h) => h.includes("token"))!;
      expect(m.html.split(link).length).toBeGreaterThan(2); // aparece no botão E no texto
      expect(m.text).toContain(link.replace(/&amp;/g, "&"));
    }
  });
});

describe("conteúdo de cada e-mail", () => {
  it("confirmação: primeiro nome, validade e link", () => {
    const m = all()[0];
    expect(m.subject).toMatch(/Confirme/);
    expect(m.html).toContain("Olá, Maria!");
    expect(m.html).toContain("verify-email?token=abc&amp;callbackURL=%2Fx"); // & escapado
    expect(m.html).toMatch(/24 horas/);
    expect(m.text).toMatch(/24 horas/);
  });

  it("redefinição: link, validade e aviso para ignorar", () => {
    const m = all()[1];
    expect(m.subject).toMatch(/senha/i);
    expect(m.html).toMatch(/60 minutos/);
    expect(m.html).toMatch(/ignore esta mensagem/i);
  });

  it("alerta para a própria pessoa: valor em destaque, sentido da faixa e mensagem segura", () => {
    const m = all()[2];
    expect(m.subject).toMatch(/fora da faixa/);
    expect(m.html).toContain(">212<");
    expect(m.html).toContain("Acima da faixa");
    expect(m.html).toMatch(/conferir a medição/);
    expect(m.html).toMatch(/podem atrasar ou não chegar/);
    expect(m.html).toMatch(/desligar ou mostrar menos detalhes no Perfil/);
    expect(m.text).toContain("212 mg/dL");
  });

  it("alerta para familiar: traz o nome de quem registrou e o link da pessoa", () => {
    const m = all()[3];
    expect(m.subject).toBe("Aviso de glicemia de João");
    expect(m.html).toContain("Abaixo da faixa");
    expect(m.html).toContain("/familia/u1");
    expect(m.html).not.toMatch(/Sua última medição/);
  });

  it("código de duas etapas: código grande, validade e aviso de nunca compartilhar", () => {
    const m = all()[4];
    expect(m.subject).toBe("Seu código de acesso: 123456");
    expect(m.html).toContain("123456");
    expect(m.html).toMatch(/3 minutos/);
    expect(m.html).toMatch(/Nunca passe este código/);
  });
});

describe("alertas discretos (padrão)", () => {
  it.each([
    alertEmail({ value: 212, direction: "high", appUrl: APP, link: `${APP}/glicemia` }),
    alertEmail({ value: 54, direction: "low", appUrl: APP, ownerName: "João", link: `${APP}/familia/u1` }),
  ])("sem valor, nome nem direção no assunto, na pré-visualização e no corpo", (m) => {
    expect(m.subject).toBe("Novo aviso no Glicose Tech");
    for (const part of [m.subject, m.html, m.text]) {
      expect(part).not.toMatch(/212|54 mg|mg\/dL|João|acima|abaixo/i);
    }
    expect(m.html).toMatch(/Abra o app/);
    expect(m.text).toMatch(/não use o Glicose Tech como único meio/);
  });
});

describe("segurança dos modelos", () => {
  it("escapa HTML no nome e no link (sem injeção)", () => {
    const m = verificationEmail({ name: "<script>alert(1)</script> Hacker", url: 'https://x.test/?a="><img src=x onerror=1>', appUrl: APP });
    expect(m.html).not.toContain("<script>");
    expect(m.html).not.toMatch(/<img[^>]*onerror/i); // nenhuma tag injetada
    expect(m.html).toContain('?a=&quot;&gt;&lt;img src=x onerror=1&gt;'); // o conteúdo ficou como texto
    expect(m.html).toContain("&lt;script&gt;");
  });

  it("só aceita links http(s): outro esquema vira o endereço do app", () => {
    const m = resetPasswordEmail({ name: "A", url: "javascript:alert(1)", appUrl: APP });
    expect(m.html).not.toContain("javascript:");
    expect(m.html).toContain(`href="${APP}"`);
  });
});
