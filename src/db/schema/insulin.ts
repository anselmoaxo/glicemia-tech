import { sql } from "drizzle-orm";
import { check, index, numeric, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { users } from "./auth";

// Tipos de insulina definidos pelo próprio usuário (ex.: "NPH", "Regular").
export const insulinTypes = pgTable(
  "insulin_types",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [unique("insulin_types_user_name_uq").on(t.userId, t.name)],
);

export const insulinLogs = pgTable(
  "insulin_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    insulinTypeId: uuid("insulin_type_id")
      .notNull()
      .references(() => insulinTypes.id, { onDelete: "restrict" }),
    units: numeric("units", { precision: 4, scale: 1 }).notNull(),
    appliedAt: timestamp("applied_at", { withTimezone: true }).notNull(),
    mealRelation: text("meal_relation").notNull(),
    site: text("site"),
    notes: text("notes"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("insulin_logs_user_applied_idx").on(t.userId, t.appliedAt.desc()),
    check("insulin_logs_units_chk", sql`${t.units} > 0 and ${t.units} <= 300`),
    check(
      "insulin_logs_relation_chk",
      sql`${t.mealRelation} in ('antes_refeicao','com_refeicao','apos_refeicao','sem_relacao')`,
    ),
    check(
      "insulin_logs_site_chk",
      sql`${t.site} is null or ${t.site} in ('abdomen','coxa','braco','gluteo','outro')`,
    ),
  ],
);
