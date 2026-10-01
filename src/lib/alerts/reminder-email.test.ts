import { describe, expect, it } from "vitest";
import { reminderEmail } from "@/lib/email-templates";

describe("reminderEmail", () => {
  const mail = reminderEmail({ appUrl: "https://app.exemplo.com.br" });
  it("não traz nenhum dado de saúde e aponta para o registro e para os ajustes", () => {
    for (const body of [mail.html, mail.text]) {
      expect(body).not.toMatch(/mg\/dL/);
      expect(body).not.toMatch(/hipo|hiper|fora da faixa/i);
      expect(body).toContain("https://app.exemplo.com.br/glicemia/nova");
      expect(body).toContain("https://app.exemplo.com.br/alertas");
    }
    expect(mail.subject).not.toMatch(/\d/);
  });
});
