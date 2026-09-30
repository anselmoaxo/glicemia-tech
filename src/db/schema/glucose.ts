import { sql } from "drizzle-orm";
import { check, index, integer, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { users } from "./auth";

// Contextos personalizados por usuário (os padrões ficam em código).
export const glucoseContexts = pgTable(
  "glucose_contexts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [unique("glucose_contexts_user_label_uq").on(t.userId, t.label)],
);

export const glucoseReadings = pgTable(
  "glucose_readings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    valueMgDl: integer("value_mg_dl").notNull(),
    measuredAt: timestamp("measured_at", { withTimezone: true }).notNull(),
    contextKey: text("context_key").notNull(),
    customContextId: uuid("custom_context_id").references(() => glucoseContexts.id, {
      onDelete: "set null",
    }),
    notes: text("notes"),
    symptoms: text("symptoms"),
    activity: text("activity"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("glucose_readings_user_measured_idx").on(t.userId, t.measuredAt.desc()),
    check("glucose_readings_value_chk", sql`${t.valueMgDl} between 20 and 600`),
    check(
      "glucose_readings_context_chk",
      sql`${t.contextKey} in ('jejum','antes_refeicao','apos_1h','apos_2h','antes_dormir','aleatoria','personalizado')`,
    ),
  ],
);

export const glucoseTargets = pgTable(
  "glucose_targets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    targetKey: text("target_key").notNull(),
    minMgDl: integer("min_mg_dl").notNull(),
    maxMgDl: integer("max_mg_dl").notNull(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    unique("glucose_targets_user_key_uq").on(t.userId, t.targetKey),
    check("glucose_targets_range_chk", sql`${t.minMgDl} < ${t.maxMgDl}`),
    check("glucose_targets_key_chk", sql`${t.targetKey} in ('geral','jejum','pos_refeicao')`),
  ],
);
