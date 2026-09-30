// Telefone celular: aceita vários jeitos de digitar e guarda em E.164 (ex.: +5511912345678),
// o formato exigido por serviços de WhatsApp/SMS.

// DDDs válidos no Brasil (pega erro de digitação como 00, 10, 20...).
const VALID_DDD = new Set([
  11, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 24, 27, 28, 31, 32, 33, 34, 35, 37, 38, 41, 42, 43, 44, 45, 46, 47, 48,
  49, 51, 53, 54, 55, 61, 62, 63, 64, 65, 66, 67, 68, 69, 71, 73, 74, 75, 77, 79, 81, 82, 83, 84, 85, 86, 87, 88, 89,
  91, 92, 93, 94, 95, 96, 97, 98, 99,
]);

export const PHONE_HINT = "Celular com DDD, por exemplo (11) 91234-5678.";

export type PhoneResult = { ok: true; e164: string } | { ok: false; message: string };

const digits = (s: string) => s.replace(/\D/g, "");

export function normalizePhone(input: string): PhoneResult {
  const raw = input.trim();
  if (raw === "") return { ok: false, message: "Informe o celular com DDD." };

  // Número de outro país, digitado com "+": aceita no formato internacional.
  if (raw.startsWith("+") && !raw.startsWith("+55")) {
    const d = digits(raw);
    return d.length >= 8 && d.length <= 15 && d[0] !== "0"
      ? { ok: true, e164: `+${d}` }
      : { ok: false, message: "Número internacional inválido. Use o formato +país número." };
  }

  let d = digits(raw);
  if (d.startsWith("55") && (d.length === 12 || d.length === 13)) d = d.slice(2); // código do Brasil
  if (d.startsWith("0") && d.length === 12) d = d.slice(1); // zero de chamada interurbana (0 + DDD + 9 dígitos)

  if (d.length === 10 && /^[2-5]/.test(d.slice(2))) {
    return { ok: false, message: "Esse parece ser um telefone fixo. Informe um celular, com o 9 na frente." };
  }
  if (d.length !== 11 || d[2] !== "9") return { ok: false, message: `Celular inválido. ${PHONE_HINT}` };
  if (!VALID_DDD.has(Number(d.slice(0, 2)))) return { ok: false, message: "DDD inválido. Confira os dois primeiros números." };
  return { ok: true, e164: `+55${d}` };
}

/** "+5511912345678" -> "(11) 91234-5678". Números de outros países ficam como estão. */
export function formatPhoneDisplay(e164: string | null | undefined): string {
  if (!e164) return "";
  const m = /^\+55(\d{2})(\d{5})(\d{4})$/.exec(e164);
  return m ? `(${m[1]}) ${m[2]}-${m[3]}` : e164;
}

/** Usado ao sair do campo: se o número for válido, mostra formatado; senão deixa como a pessoa digitou. */
export function tidyPhoneInput(value: string): string {
  const r = normalizePhone(value);
  return r.ok ? formatPhoneDisplay(r.e164) : value;
}

/** Mostra só o final, para telas de conferência e registros: "(11) •••••-5678". */
export function maskPhone(e164: string | null | undefined): string {
  const m = /^\+55(\d{2})\d{5}(\d{4})$/.exec(e164 ?? "");
  return m ? `(${m[1]}) •••••-${m[2]}` : e164 ? "••••" + e164.slice(-4) : "";
}
