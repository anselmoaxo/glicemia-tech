import { isIP } from "node:net";

// Proteção contra SSRF: o servidor nunca deve chamar endereços internos ou privados a pedido do usuário.

const v4 = (ip: string) => ip.split(".").map(Number);

function privateV4(ip: string): boolean {
  const [a, b, c] = v4(ip);
  return (
    a === 0 || a === 10 || a === 127 ||
    (a === 100 && b >= 64 && b <= 127) || // CGNAT
    (a === 169 && b === 254) || // link-local e metadados de nuvem
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 0 && c === 0) || (a === 192 && b === 0 && c === 2) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) || (a === 198 && b === 51 && c === 100) ||
    (a === 203 && b === 0 && c === 113) ||
    a >= 224 // multicast e reservados
  );
}

/** Verdadeiro para qualquer endereço que não seja um destino público de internet. */
export function isPrivateIp(ip: string): boolean {
  const kind = isIP(ip);
  if (kind === 4) return privateV4(ip);
  if (kind !== 6) return true; // não é IP válido: trata como bloqueado
  const l = ip.toLowerCase();
  const mapped = l.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return privateV4(mapped[1]);
  const hexMapped = l.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
  if (hexMapped) {
    const hi = parseInt(hexMapped[1], 16);
    const lo = parseInt(hexMapped[2], 16);
    return privateV4(`${hi >> 8}.${hi & 255}.${lo >> 8}.${lo & 255}`);
  }
  return (
    l === "::" || l === "::1" ||
    /^f[cd]/.test(l) || // fc00::/7
    /^fe[89ab]/.test(l) || // fe80::/10
    l.startsWith("ff") || // multicast
    l.startsWith("64:ff9b:") || l.startsWith("2001:db8:") || l.startsWith("2002:") || l.startsWith("::ffff:")
  );
}

const ALLOWED_PORTS = new Set(["", "443", "5678"]);
const BLOCKED_SUFFIXES = [".local", ".localhost", ".internal", ".lan", ".home", ".corp", ".intranet", ".private", ".arpa"];

export type UrlCheck = { ok: true; url: URL } | { ok: false; error: string };

/** Validação sintática (sem rede): https, sem credenciais, porta permitida, nome de domínio público. */
export function validateWebhookUrl(raw: string): UrlCheck {
  const text = raw.trim();
  if (text.length === 0 || text.length > 500) return { ok: false, error: "Informe uma URL de até 500 caracteres." };
  let url: URL;
  try {
    url = new URL(text);
  } catch {
    return { ok: false, error: "URL inválida." };
  }
  if (url.protocol !== "https:") return { ok: false, error: "Use uma URL https://." };
  if (url.username || url.password) return { ok: false, error: "A URL não pode conter usuário ou senha." };
  if (!ALLOWED_PORTS.has(url.port)) return { ok: false, error: "Porta não permitida (use 443 ou 5678)." };
  const host = url.hostname.toLowerCase().replace(/\.$/, "");
  if (isIP(host) || host.startsWith("[")) return { ok: false, error: "Use um nome de domínio, não um endereço IP." };
  if (!host.includes(".") || host === "localhost" || BLOCKED_SUFFIXES.some((s) => host.endsWith(s))) {
    return { ok: false, error: "Endereço interno ou privado não é permitido." };
  }
  if (host.length > 253 || /[^a-z0-9.-]/.test(host)) return { ok: false, error: "Domínio inválido." };
  return { ok: true, url };
}
