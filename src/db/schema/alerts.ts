import { sql } from "drizzle-orm";
import { boolean, check, index, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./auth";
import { glucoseReadings } from "./glucose";

// Um alerta por medição fora da faixa configurada pelo usuário.
export const alerts = pgTable(
  "alerts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    readingId: uuid("reading_id")
      .notNull()
      .unique()
      .references(() => glucoseReadings.id, { onDelete: "cascade" }),
    direction: text("direction").notNull(),
    valueMgDl: integer("value_mg_dl").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("alerts_user_created_idx").on(t.userId, t.createdAt.desc()),
    check("alerts_direction_chk", sql`${t.direction} in ('low','high')`),
  ],
);

// Registro de envios (sem guardar endereço nem conteúdo da mensagem).
export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    alertId: uuid("alert_id").references(() => alerts.id, { onDelete: "cascade" }),
    recipientType: text("recipient_type").notNull(),
    status: text("status").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("notifications_user_idx").on(t.userId),
    check("notifications_recipient_chk", sql`${t.recipientType} in ('self','family')`),
    check("notifications_status_chk", sql`${t.status} in ('sent','failed')`),
  ],
);

// Faixa pessoal para o aviso na tela (uma linha por usuário). Nunca é preenchida automaticamente.
export const alertSettings = pgTable(
  "alert_settings",
  {
    userId: text("user_id")
      .primaryKey()
      .references(() => users.id, { onDelete: "cascade" }),
    rangeEnabled: boolean("range_enabled").notNull().default(false),
    lowMgDl: integer("low_mg_dl"),
    highMgDl: integer("high_mg_dl"),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    check(
      "alert_settings_range_chk",
      sql`(${t.lowMgDl} is null and ${t.highMgDl} is null) or (${t.lowMgDl} between 20 and 600 and ${t.highMgDl} between 20 and 600 and ${t.lowMgDl} < ${t.highMgDl})`,
    ),
    check(
      "alert_settings_enabled_chk",
      sql`not ${t.rangeEnabled} or (${t.lowMgDl} is not null and ${t.highMgDl} is not null)`,
    ),
  ],
);

// Lembretes para medir/registrar. Horário local (HH:MM) no fuso do próprio lembrete.
export const reminders = pgTable(
  "reminders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    timeLocal: text("time_local").notNull(),
    // Dias da semana em bits (domingo = 1, segunda = 2, ... sábado = 64); 127 = todos os dias
    daysMask: integer("days_mask").notNull().default(127),
    timezone: text("timezone").notNull().default("America/Sao_Paulo"),
    enabled: boolean("enabled").notNull().default(true),
    // Último dia (no fuso do lembrete) em que foi enviado: evita repetir no mesmo dia
    lastSentOn: text("last_sent_on"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("reminders_user_idx").on(t.userId),
    index("reminders_enabled_idx").on(t.enabled),
    check("reminders_time_chk", sql`${t.timeLocal} ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'`),
    check("reminders_days_chk", sql`${t.daysMask} between 1 and 127`),
  ],
);
