import { describe, expect, it } from "vitest";
import { backoffMs, buildPayload, signPayload, verifySignature } from "./sign";
import { isPrivateIp, validateWebhookUrl } from "./url";

describe("SSRF", () => {
  it("bloqueia endereços internos", () => {
    for (const ip of ["127.0.0.1", "10.1.2.3", "172.16.0.1", "192.168.1.1", "169.254.169.254", "100.64.0.1", "0.0.0.0", "::1", "fd00::1", "fe80::1", "::ffff:127.0.0.1", "::ffff:7f00:1"]) {
      expect(isPrivateIp(ip), ip).toBe(true);
    }
    expect(isPrivateIp("8.8.8.8")).toBe(false);
    expect(isPrivateIp("2606:4700:4700::1111")).toBe(false);
  });
  it("aceita só https em domínio público", () => {
    expect(validateWebhookUrl("https://meu-n8n.exemplo.com.br/webhook/abc").ok).toBe(true);
    expect(validateWebhookUrl("https://n8n.exemplo.com:5678/webhook/abc").ok).toBe(true);
  });
  it("recusa formas perigosas", () => {
    for (const u of [
      "http://exemplo.com/x", "https://localhost/x", "https://127.0.0.1/x", "https://[::1]/x", "https://169.254.169.254/latest",
      "https://user:pass@exemplo.com/x", "https://exemplo.com:22/x", "https://servidor/x", "https://db.internal/x",
      "https://app.local/x", "ftp://exemplo.com/x", "javascript:alert(1)", "", "https://2130706433/x",
    ]) {
      expect(validateWebhookUrl(u).ok, u).toBe(false);
    }
  });
});

describe("assinatura e reenvio", () => {
  it("assina e confere", () => {
    const body = buildPayload({ eventId: "11111111-1111-4111-8111-111111111111", type: "test", occurredAt: new Date(0), profileRef: "abc" });
    const sig = signPayload("segredo", "123", body);
    expect(verifySignature("segredo", "123", body, `v1=${sig}`)).toBe(true);
    expect(verifySignature("outro", "123", body, sig)).toBe(false);
    expect(verifySignature("segredo", "124", body, sig)).toBe(false);
  });
  it("o corpo não leva dados pessoais nem de saúde", () => {
    const body = buildPayload({ eventId: "e", type: "measurement_out_of_range", occurredAt: new Date(0), profileRef: "ref" });
    expect(Object.keys(JSON.parse(body)).sort()).toEqual(["id", "occurredAt", "profileRef", "schema", "type"]);
  });
  it("espera cada vez mais entre tentativas", () => {
    const waits = [1, 2, 3, 4, 5].map(backoffMs);
    expect(waits).toEqual([...waits].sort((a, b) => a - b));
    expect(new Set(waits).size).toBe(5);
  });
});
