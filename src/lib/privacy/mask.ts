/** a***@dominio.com: mostra só a primeira letra do usuário. */
export function maskEmail(email: string): string {
  const [user = "", domain = ""] = email.trim().toLowerCase().split("@");
  if (!user || !domain) return "***";
  return `${user[0]}***@${domain}`;
}
