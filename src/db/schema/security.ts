import { bigint, index, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

// Limite de requisições por IP e rota (usado pelo Better Auth; guardado no banco porque na Vercel
// cada requisição pode cair numa instância diferente e a memória não serve).
export const rateLimits = pgTable("rate_limits", {
  id: text("id").primaryKey(),
  key: text("key").notNull().unique(),
  count: integer("count").notNull(),
  lastRequest: bigint("last_request", { mode: "number" }).notNull(),
});

// Tentativas de login por e-mail. A chave é um HMAC do e-mail: não guardamos o endereço aqui
// e o bloqueio vale igual para contas que não existem (não revela quem tem cadastro).
export const loginAttempts = pgTable(
  "login_attempts",
  {
    key: text("key").primaryKey(),
    failures: integer("failures").notNull(),
    windowStart: timestamp("window_start", { withTimezone: true }).notNull(),
    lockedUntil: timestamp("locked_until", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("login_attempts_updated_idx").on(t.updatedAt)],
);
