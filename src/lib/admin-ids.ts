/** Lê a lista de administradores (IDs separados por vírgula). */
export function parseAdminIds(raw: string | undefined | null) {
  return new Set(
    (raw ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );
}
