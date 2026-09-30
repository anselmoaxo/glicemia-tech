import { check, date, index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./auth";

// Link temporário, somente leitura, para o médico (sem conta). Só o hash do token é guardado.
export const sharedReports = pgTable(
  "shared_reports",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull().unique(),
    fromDate: date("from_date").notNull(),
    toDate: date("to_date").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("shared_reports_user_idx").on(t.userId, t.createdAt.desc()),
    check("shared_reports_range_chk", sql`${t.fromDate} <= ${t.toDate}`),
  ],
);
