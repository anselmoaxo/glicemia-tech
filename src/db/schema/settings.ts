import { jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { users } from "./auth";

// Configurações do app ajustáveis pelo administrador sem alterar o código (ex.: limite de acompanhantes por perfil).
// Sem linha = vale o padrão definido em src/lib/settings.ts.
export const appSettings = pgTable("app_settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedBy: text("updated_by").references(() => users.id, { onDelete: "set null" }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
