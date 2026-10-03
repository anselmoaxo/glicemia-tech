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
    // Celular em E.164 (+5511912345678), para notificações futuras (WhatsApp/SMS)
    phone: text("phone"),
    sex: text("sex"),
    // Ano do diagnóstico (o "há quantos anos" é calculado na hora)
    diagnosisYear: integer("diagnosis_year"),
    timezone: text("timezone").notNull().default("America/Sao_Paulo"),
    // Percentual de escala da fonte (acessibilidade para idosos)
    fontScale: integer("font_scale").notNull().default(100),
    // Alertas de valores fora da faixa por e-mail (desativados por padrão)
    alertEmailSelf: boolean("alert_email_self").notNull().default(false),
    alertEmailFamily: boolean("alert_email_family").notNull().default(false),
    // Finalidade do acompanhamento, informada pela própria pessoa (não é diagnóstico)
    trackingPurpose: text("tracking_purpose"),
    // Menor de idade: ciência de um responsável legal (registrada em consent_logs)
    guardianConsentAt: timestamp("guardian_consent_at"),
    lgpdConsentAt: timestamp("lgpd_consent_at"),
    // Mostrar o valor da glicemia em e-mails de aviso (assunto/pré-visualização aparecem na tela bloqueada). Desligado por padrão.
    notificationDetails: boolean("notification_details").notNull().default(false),
    // Ao completar 18 anos, quando a própria pessoa revisou quem tem acesso aos dados dela
    majorityReviewedAt: timestamp("majority_reviewed_at", { withTimezone: true }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    check("profiles_font_scale_chk", sql`${t.fontScale} between 100 and 150`),
    check("profiles_phone_chk", sql`${t.phone} is null or ${t.phone} ~ '^\\+[1-9][0-9]{7,14}$'`),
    check(
      "profiles_sex_chk",
      sql`${t.sex} is null or ${t.sex} in ('feminino','masculino','nao_informado')`,
    ),
    check(
      "profiles_diagnosis_year_chk",
      sql`${t.diagnosisYear} is null or ${t.diagnosisYear} between 1900 and 2200`,
    ),
    check(
      "profiles_tracking_purpose_chk",
      sql`${t.trackingPurpose} is null or ${t.trackingPurpose} in ('pessoal','diabetes','outro','sem_diabetes')`,
    ),
    check(
      "profiles_diabetes_type_chk",
      sql`${t.diabetesType} is null or ${t.diabetesType} in ('tipo1','tipo2','gestacional','outro','nao_informado')`,
    ),
  ],
);
