import { createHash, randomBytes } from "node:crypto";

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

/** Token aleatório de 256 bits; só o hash é persistido. */
export function generateToken() {
  const token = randomBytes(32).toString("base64url");
  return { token, hash: hashToken(token) };
}

export function addDays(days: number, from = new Date()) {
  return new Date(from.getTime() + days * 24 * 60 * 60 * 1000);
}

/** Um link é utilizável se não foi revogado e ainda não expirou. */
export function isActive(link: { expiresAt: Date; revokedAt?: Date | null }, now = new Date()) {
  return !link.revokedAt && link.expiresAt.getTime() > now.getTime();
}
