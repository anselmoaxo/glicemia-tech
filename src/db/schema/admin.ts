import { sql } from "drizzle-orm";
import { check, index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./auth";

// Trilha de auditoria das ações administrativas (sem dados de saúde).
export const adminAuditLogs = pgTable(
  "admin_audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    adminId: text("admin_id").references(() => users.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    // Guardado como texto: a conta alvo pode já ter sido excluída.
    targetEmail: text("target_email").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("admin_audit_logs_created_idx").on(t.createdAt.desc()),
    check("admin_audit_logs_action_chk", sql`${t.action} in ('suspend','unsuspend','delete')`),
  ],
);
