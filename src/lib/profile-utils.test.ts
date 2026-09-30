import { describe, expect, it } from "vitest";
import { ageFromBirthDate, describePatient, diagnosisYearToYears, yearsToDiagnosisYear } from "./profile-utils";

const now = new Date(2026, 2, 10); // 10/03/2026

describe("ageFromBirthDate", () => {
  it("conta anos completos", () => {
    expect(ageFromBirthDate("1960-03-10", now)).toBe(66);
    expect(ageFromBirthDate("1960-03-11", now)).toBe(65); // aniversário amanhã
    expect(ageFromBirthDate("1960-12-01", now)).toBe(65);
  });
  it("rejeita valores inválidos ou no futuro", () => {
    expect(ageFromBirthDate(null, now)).toBeNull();
    expect(ageFromBirthDate("abc", now)).toBeNull();
    expect(ageFromBirthDate("2030-01-01", now)).toBeNull();
  });
});

describe("anos com diabetes", () => {
  it("converte ida e volta", () => {
    expect(yearsToDiagnosisYear(8, now)).toBe(2018);
    expect(diagnosisYearToYears(2018, now)).toBe(8);
    expect(yearsToDiagnosisYear(null, now)).toBeNull();
    expect(diagnosisYearToYears(null, now)).toBeNull();
  });
});

describe("describePatient", () => {
  it("monta o resumo só com o que foi informado", () => {
    expect(
      describePatient({ birthDate: "1960-03-10", sex: "feminino", diabetesType: "tipo2", diagnosisYear: 2018 }, now),
    ).toBe("66 anos · Feminino · Diabetes tipo 2, há 8 anos");
    expect(
      describePatient({ birthDate: null, sex: "nao_informado", diabetesType: "nao_informado", diagnosisYear: null }, now),
    ).toBe("");
    expect(describePatient({ birthDate: null, sex: null, diabetesType: null, diagnosisYear: 2026 }, now)).toBe(
      "Diabetes há menos de 1 ano",
    );
  });
});
