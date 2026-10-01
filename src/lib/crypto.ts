import "server-only";
import { createCipheriv, createDecipheriv, createHmac, hkdfSync, randomBytes } from "node:crypto";
import { env } from "@/lib/env";

// Cifra URL e segredo do webhook em repouso (AES-256-GCM). A chave deriva de BETTER_AUTH_SECRET:
// trocar esse segredo invalida as integrações salvas (a pessoa reconfigura).
const key = () => Buffer.from(hkdfSync("sha256", env.BETTER_AUTH_SECRET, "glicose-tech", "webhook-v1", 32));

export function encrypt(plain: string): string {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", key(), iv);
  const enc = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  return [iv, c.getAuthTag(), enc].map((b) => b.toString("base64url")).join(".");
}

export function decrypt(token: string): string | null {
  try {
    const [iv, tag, enc] = token.split(".").map((p) => Buffer.from(p, "base64url"));
    const d = createDecipheriv("aes-256-gcm", key(), iv);
    d.setAuthTag(tag);
    return Buffer.concat([d.update(enc), d.final()]).toString("utf8");
  } catch {
    return null;
  }
}

/** Identificador estável e opaco do perfil (não revela o id da conta nem permite descobri-lo). */
export const opaqueProfileId = (userId: string) =>
  createHmac("sha256", env.BETTER_AUTH_SECRET).update(`profile:${userId}`).digest("hex").slice(0, 32);
