import { sql } from "drizzle-orm";
import { boolean, check, date, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { users } from "./auth";

export const profiles = pgTable(
  "profiles",
  {
    userId: text("user_id")
      .primaryKey()
      .references(() => users.id, { onDelete: "cascade" }),
    birthDate: date("birth_date"),
    diabetesType: text("diabetes_type"),
    sex: text("sex"),
    // Ano do diagnóstico (o "há quantos anos" é calculado na hora)
    diagnosisYear: integer("diagnosis_year"),
    timezone: text("timezone").notNull().default("America/Sao_Paulo"),
    // Percentual de escala da fonte (acessibilidade para idosos)
    fontScale: integer("font_scale").notNull().default(100),
    // Alertas de valores fora da faixa por e-mail (desativados por padrão)
    alertEmailSelf: boolean("alert_email_self").notNull().default(false),
    alertEmailFamily: boolean("alert_email_family").notNull().default(false),
    lgpdConsentAt: timestamp("lgpd_consent_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    check("profiles_font_scale_chk", sql`${t.fontScale} between 100 and 150`),
    check("profiles_sex_chk", sql`${t.sex} is null or ${t.sex} in ('feminino','masculino','nao_informado')`),
    check("profiles_diagnosis_year_chk", sql`${t.diagnosisYear} is null or ${t.diagnosisYear} between 1900 and 2200`),
    check(
      "profiles_diabetes_type_chk",
      sql`${t.diabetesType} is null or ${t.diabetesType} in ('tipo1','tipo2','gestacional','outro','nao_informado')`,
    ),
  ],
);
