import { sql } from "drizzle-orm";
import { check, index, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
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
