import { sql } from "drizzle-orm";
import { boolean, check, index, integer, jsonb, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { users } from "./auth";

// Plano de acompanhamento: preferências de LEMBRETE e organização, informadas pela pessoa (ou responsável) conforme
// o plano de cuidado recebido de um profissional. Não há valores padrão clínicos: tudo começa vazio/desligado.
export const trackingPlans = pgTable(
  "tracking_plans",
  {
    userId: text("user_id")
      .primaryKey()
      .references(() => users.id, { onDelete: "cascade" }),
    // "Não tenho diabetes" no perfil esconde os controles; isto liga o acompanhamento específico mesmo assim
    specificEnabled: boolean("specific_enabled").notNull().default(false),
    // Dias (bits, domingo = 1) e horários HH:MM em que a pessoa costuma medir
    measureDaysMask: integer("measure_days_mask"),
    measureTimes: jsonb("measure_times").$type<string[]>().notNull().default([]),
    // Medições previstas por dia, só se fizer parte do plano de cuidado
    expectedPerDay: integer("expected_per_day"),
    // Tolerância (minutos) depois do horário previsto antes de lembrar; vazio = sem lembrete de medição esquecida
    toleranceMin: integer("tolerance_min"),
    trackMedication: boolean("track_medication").notNull().default(false),
    // Canais e categorias opcionais (tudo desligado até a pessoa escolher)
    channelApp: boolean("channel_app").notNull().default(false),
    emailMissedMeasure: boolean("email_missed_measure").notNull().default(false),
    emailMedUnconfirmed: boolean("email_med_unconfirmed").notNull().default(false),
    notifyFamily: boolean("notify_family").notNull().default(false),
    updatedBy: text("updated_by").references(() => users.id, { onDelete: "set null" }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check("tracking_plans_expected_chk", sql`${t.expectedPerDay} is null or ${t.expectedPerDay} between 1 and 24`),
    check("tracking_plans_tolerance_chk", sql`${t.toleranceMin} is null or ${t.toleranceMin} between 5 and 720`),
    check("tracking_plans_days_chk", sql`${t.measureDaysMask} is null or ${t.measureDaysMask} between 1 and 127`),
  ],
);

// Um registro por ocorrência verificada (medição prevista ou dose). A chave única impede repetir o aviso.
export const planEvents = pgTable(
  "plan_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(),
    // ex.: measure:2026-10-01:07:30  |  med:<scheduleId>:2026-10-01
    slotKey: text("slot_key").notNull(),
    slotAt: timestamp("slot_at", { withTimezone: true }).notNull(),
    // reminder_sent = lembrete enviado; unconfirmed = sem confirmação até a verificação (não prova que não mediu/tomou)
    status: text("status").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique("plan_events_slot_uq").on(t.userId, t.slotKey),
    index("plan_events_user_idx").on(t.userId, t.createdAt.desc()),
    check("plan_events_kind_chk", sql`${t.kind} in ('missed_measurement','med_unconfirmed')`),
    check("plan_events_status_chk", sql`${t.status} in ('reminder_sent','unconfirmed')`),
  ],
);

// Integração com o n8n (uma por usuário, para o próprio perfil). URL e segredo ficam cifrados no servidor.
export const webhookIntegrations = pgTable(
  "webhook_integrations",
  {
    userId: text("user_id")
      .primaryKey()
      .references(() => users.id, { onDelete: "cascade" }),
    enabled: boolean("enabled").notNull().default(false),
    urlEnc: text("url_enc"),
    urlHost: text("url_host"),
    secretEnc: text("secret_enc"),
    evOutOfRange: boolean("ev_out_of_range").notNull().default(false),
    evMissedMeasure: boolean("ev_missed_measure").notNull().default(false),
    evMedUnconfirmed: boolean("ev_med_unconfirmed").notNull().default(false),
    // diabetes_only: só enquanto os controles de diabetes estiverem ativos no perfil; profile: este perfil, sempre
    scope: text("scope").notNull().default("diabetes_only"),
    consentAt: timestamp("consent_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [check("webhook_integrations_scope_chk", sql`${t.scope} in ('diabetes_only','profile')`)],
);

export const webhookDeliveries = pgTable(
  "webhook_deliveries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    // identificador do evento, repetido em toda tentativa: quem recebe usa para ignorar duplicatas
    eventId: uuid("event_id").notNull(),
    type: text("type").notNull(),
    status: text("status").notNull().default("pending"),
    attempts: integer("attempts").notNull().default(0),
    nextAttemptAt: timestamp("next_attempt_at", { withTimezone: true }),
    httpStatus: integer("http_status"),
    lastError: text("last_error"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
  },
  (t) => [
    unique("webhook_deliveries_event_uq").on(t.userId, t.eventId),
    index("webhook_deliveries_user_idx").on(t.userId, t.createdAt.desc()),
    index("webhook_deliveries_due_idx").on(t.status, t.nextAttemptAt),
    check("webhook_deliveries_status_chk", sql`${t.status} in ('pending','delivered','failed')`),
    check("webhook_deliveries_type_chk", sql`${t.type} in ('test','measurement_out_of_range','measurement_missed','medication_unconfirmed')`),
  ],
);

// Histórico de e-mails: sem conteúdo e sem dados de saúde. Destinatário só mascarado.
export const emailLogs = pgTable(
  "email_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
    category: text("category").notNull(),
    reason: text("reason").notNull(),
    recipientMasked: text("recipient_masked").notNull(),
    status: text("status").notNull().default("pending"),
    providerId: text("provider_id"),
    error: text("error"),
    requestedAt: timestamp("requested_at", { withTimezone: true }).notNull().defaultNow(),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    providerUpdatedAt: timestamp("provider_updated_at", { withTimezone: true }),
  },
  (t) => [
    index("email_logs_user_idx").on(t.userId, t.requestedAt.desc()),
    index("email_logs_provider_idx").on(t.providerId),
    index("email_logs_requested_idx").on(t.requestedAt.desc()),
    check(
      "email_logs_status_chk",
      sql`${t.status} in ('pending','sent','delivered','delayed','rejected','failed','unknown')`,
    ),
  ],
);
