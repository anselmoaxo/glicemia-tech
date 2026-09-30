import { sql } from "drizzle-orm";
import { check, index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./auth";

export const meals = pgTable(
  "meals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    mealType: text("meal_type").notNull(),
    customType: text("custom_type"),
    eatenAt: timestamp("eaten_at", { withTimezone: true }).notNull(),
    description: text("description").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("meals_user_eaten_idx").on(t.userId, t.eatenAt.desc()),
    check(
      "meals_type_chk",
      sql`${t.mealType} in ('cafe_manha','almoco','jantar','lanche','personalizado')`,
    ),
    check(
      "meals_custom_type_chk",
      sql`(${t.mealType} = 'personalizado') = (${t.customType} is not null)`,
    ),
  ],
);

// Preparada para a foto opcional (armazenamento ainda não definido).
export const mealPhotos = pgTable(
  "meal_photos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    mealId: uuid("meal_id")
      .notNull()
      .references(() => meals.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    storageKey: text("storage_key").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("meal_photos_meal_idx").on(t.mealId)],
);
