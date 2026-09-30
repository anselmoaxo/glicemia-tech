import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  pgTable,
  text,
  time,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "./auth";

// Medicamentos são desativados (active = false), nunca apagados: preserva o histórico.
export const medications = pgTable(
  "medications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    dose: text("dose").notNull(),
    unit: text("unit").notNull(),
    notes: text("notes"),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("medications_user_active_idx").on(t.userId, t.active)],
);

export const medicationSchedules = pgTable(
  "medication_schedules",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    medicationId: uuid("medication_id")
      .notNull()
      .references(() => medications.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    time: time("time").notNull(),
    // 0 = domingo ... 6 = sábado
    daysOfWeek: integer("days_of_week").array().notNull(),
  },
  (t) => [
    index("medication_schedules_user_idx").on(t.userId),
    index("medication_schedules_med_idx").on(t.medicationId),
    check("medication_schedules_days_chk", sql`cardinality(${t.daysOfWeek}) between 1 and 7`),
  ],
);

export const medicationLogs = pgTable(
  "medication_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    medicationId: uuid("medication_id")
      .notNull()
      .references(() => medications.id, { onDelete: "cascade" }),
    // Horário agendado da dose; impede duplicar a resposta para a mesma dose.
    scheduledFor: timestamp("scheduled_for", { withTimezone: true }).notNull(),
    status: text("status").notNull(),
    loggedAt: timestamp("logged_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique("medication_logs_dose_uq").on(t.medicationId, t.scheduledFor),
    index("medication_logs_user_scheduled_idx").on(t.userId, t.scheduledFor.desc()),
    check("medication_logs_status_chk", sql`${t.status} in ('taken','skipped')`),
  ],
);
