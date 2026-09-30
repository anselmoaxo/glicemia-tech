import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { env } from "@/lib/env";

export const auth = betterAuth({
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
    },
  }),
  emailAndPassword: { enabled: true, minPasswordLength: 8 },
  user: {
    additionalFields: {
      suspendedAt: { type: "date", required: false, input: false },
    },
  },
  databaseHooks: {
    session: {
      create: {
        // Conta suspensa não consegue abrir nova sessão (login).
        before: async (session) => {
          const [user] = await db
            .select({ suspendedAt: schema.users.suspendedAt })
            .from(schema.users)
            .where(eq(schema.users.id, session.userId));
          if (user?.suspendedAt) return false;
          return { data: session };
        },
      },
    },
  },
  plugins: [nextCookies()],
});
