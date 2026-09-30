import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError, createAuthMiddleware, isAPIError } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { captcha } from "better-auth/plugins";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { captchaEnabled } from "@/lib/captcha";
import { env } from "@/lib/env";
import { lockMessage, lockStatus } from "@/lib/login-lock";
import { attemptKey, clearAttempts, getAttemptState, recordFailure } from "@/lib/login-lock-store";

const SIGN_IN = "/sign-in/email";

const emailFrom = (body: unknown) =>
  body && typeof body === "object" && typeof (body as { email?: unknown }).email === "string"
    ? (body as { email: string }).email
    : "";

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
      rateLimit: schema.rateLimits,
    },
  }),
  emailAndPassword: { enabled: true, minPasswordLength: 8 },
  user: {
    additionalFields: {
      suspendedAt: { type: "date", required: false, input: false },
    },
  },

  // Limite de requisições por IP, guardado no banco (vale para todas as instâncias da Vercel).
  rateLimit: {
    enabled: true,
    storage: "database",
    window: 60,
    max: 100,
    customRules: {
      "/sign-in/email": { window: 60, max: 10 },
      "/sign-up/email": { window: 3600, max: 10 },
      "/change-password": { window: 60, max: 5 },
    },
  },
  // Na Vercel o IP real do visitante vem nestes cabeçalhos.
  advanced: { ipAddress: { ipAddressHeaders: ["x-vercel-forwarded-for", "x-forwarded-for"] } },

  hooks: {
    // Conta bloqueada por excesso de tentativas: recusa antes mesmo de conferir a senha.
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== SIGN_IN) return;
      const email = emailFrom(ctx.body);
      if (!email) return;
      const status = lockStatus(await getAttemptState(attemptKey(email, env.BETTER_AUTH_SECRET)));
      if (status.locked) {
        throw new APIError("TOO_MANY_REQUESTS", {
          message: lockMessage(status.retryAfterSec),
          code: "ACCOUNT_TEMPORARILY_LOCKED",
        });
      }
    }),
    // Conta a senha errada; uma entrada bem-sucedida zera a contagem.
    after: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== SIGN_IN) return;
      const email = emailFrom(ctx.body);
      if (!email) return;
      const key = attemptKey(email, env.BETTER_AUTH_SECRET);
      const returned = ctx.context.returned;
      if (isAPIError(returned)) {
        const code = (returned.body as { code?: string } | undefined)?.code;
        if (code === "INVALID_EMAIL_OR_PASSWORD") await recordFailure(key);
      } else if (ctx.context.newSession) {
        await clearAttempts(key);
      }
    }),
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

  plugins: [
    nextCookies(),
    // Google reCAPTCHA v2 no cadastro e no login. Só liga com as duas chaves configuradas.
    ...(captchaEnabled()
      ? [
          captcha({
            provider: "google-recaptcha",
            secretKey: process.env.RECAPTCHA_SECRET_KEY!,
            endpoints: ["/sign-up/email", "/sign-in/email"],
            // apenas para testes automatizados (aponta para um verificador falso); em produção fica vazio
            siteVerifyURLOverride: process.env.RECAPTCHA_VERIFY_URL || undefined,
          }),
        ]
      : []),
  ],
});
