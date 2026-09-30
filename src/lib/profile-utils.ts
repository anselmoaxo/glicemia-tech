export const DIABETES_OPTIONS = [
  { value: "nao_informado", label: "Prefiro não informar" },
  { value: "tipo1", label: "Tipo 1" },
  { value: "tipo2", label: "Tipo 2" },
  { value: "gestacional", label: "Gestacional" },
  { value: "outro", label: "Outro / não sei" },
] as const;

export const SEX_OPTIONS = [
  { value: "nao_informado", label: "Prefiro não informar" },
  { value: "feminino", label: "Feminino" },
  { value: "masculino", label: "Masculino" },
] as const;

export const MAX_YEARS_WITH_DIABETES = 90;

/** Idade em anos completos a partir de YYYY-MM-DD; null se a data for inválida. */
export function ageFromBirthDate(birthDate: string | null, now = new Date()): number | null {
  if (!birthDate || !/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) return null;
  const [y, m, d] = birthDate.split("-").map(Number);
  let age = now.getFullYear() - y;
  if (now.getMonth() + 1 < m || (now.getMonth() + 1 === m && now.getDate() < d)) age -= 1;
  return age >= 0 ? age : null;
}

/** "Há quantos anos tem diabetes" -> ano do diagnóstico (guardar o ano evita que o dado envelheça). */
export function yearsToDiagnosisYear(years: number | null, now = new Date()): number | null {
  return years === null ? null : now.getFullYear() - years;
}

export function diagnosisYearToYears(year: number | null, now = new Date()): number | null {
  return year === null ? null : Math.max(0, now.getFullYear() - year);
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** Linha de resumo do paciente para relatórios. Só inclui o que foi informado. */
export function describePatient(
  p: { birthDate: string | null; sex: string | null; diabetesType: string | null; diagnosisYear: number | null },
  now = new Date(),
): string {
  const parts: string[] = [];
  const age = ageFromBirthDate(p.birthDate, now);
  if (age !== null) parts.push(plural(age, "ano", "anos"));
  const sex = SEX_OPTIONS.find((s) => s.value === p.sex);
  if (sex && sex.value !== "nao_informado") parts.push(sex.label);
  const type = DIABETES_OPTIONS.find((t) => t.value === p.diabetesType);
  const years = diagnosisYearToYears(p.diagnosisYear, now);
  if (type && type.value !== "nao_informado") {
    parts.push(
      `Diabetes ${type.label.toLowerCase()}${years !== null ? `, ${years === 0 ? "menos de 1 ano" : `há ${plural(years, "ano", "anos")}`}` : ""}`,
    );
  } else if (years !== null) {
    parts.push(years === 0 ? "Diabetes há menos de 1 ano" : `Diabetes há ${plural(years, "ano", "anos")}`);
  }
  return parts.join(" · ");
}
