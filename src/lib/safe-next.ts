/** Aceita apenas caminhos internos (evita open redirect). */
export function safeNext(value: unknown, fallback = "/inicio") {
  const v = Array.isArray(value) ? value[0] : value;
  return typeof v === "string" && v.startsWith("/") && !v.startsWith("//") && !v.includes("\\") ? v : fallback;
}
