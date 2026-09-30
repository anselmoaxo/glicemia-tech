import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError, createAuthMiddleware, isAPIError } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { captcha } from "better-auth/plugins";
import { eq } from "drizzle-orm";
import { after } from "next/server";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { captchaEnabled } from "@/lib/captcha";
import { sendEmail } from "@/lib/email";
import { emailEnabled, emailVerificationRequired } from "@/lib/email-flags";
import { resetPasswordEmail, verificationEmail } from "@/lib/email-templates";
import { env } from "@/lib/env";
import { lockMessage, lockStatus } from "@/lib/login-lock";
import { attemptKey, clearAttempts, getAttemptState, recordFailure } from "@/lib/login-lock-store";
import { yearsToDiagnosisYear } from "@/lib/profile-utils";
import { phoneRequired, signUpExtrasSchema } from "@/lib/validation";

const SIGN_IN = "/sign-in/email";
const SIGN_UP = "/sign-up/email";

const emailFrom = (body: unknown) =>
  body && typeof body === "object" && typeof (body as { email?: unknown }).email === "string"
    ? (body as { email: string }).email
    : "";

const bodyOf = (context: unknown): Record<string, unknown> => {
  const b = (context as { body?: unknown } | null | undefined)?.body;
  return b && typeof b === "object" ? (b as Record<string, unknown>) : {};
};
const text = (v: unknown) => (typeof v === "string" ? v : "");

/** Envia sem atrasar a resposta (e sem revelar, pelo tempo, se a conta existe). */
function sendInBackground(to: string, subject: string, html: string) {
  try {
    after(() => sendEmail(to, subject, html));
  } catch {
    void sendEmail(to, subject, html); // fora de uma requisição do Next (ex.: script)
  }
}

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

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    requireEmailVerification: emailVerificationRequired(),
    resetPasswordTokenExpiresIn: 60 * 60,
    revokeSessionsOnPasswordReset: true, // trocar a senha desconecta os outros aparelhos
    sendResetPassword: async ({ user, url }) => {
      const m = resetPasswordEmail(user.name, url);
      sendInBackground(user.email, m.subject, m.html);
    },
  },
  emailVerification: {
    sendOnSignUp: emailEnabled(),
    sendOnSignIn: emailEnabled(), // quem tenta entrar sem confirmar recebe um link novo
    autoSignInAfterVerification: true,
    expiresIn: 60 * 60 * 24,
    sendVerificationEmail: async ({ user, url }) => {
      const m = verificationEmail(user.name, url);
      sendInBackground(user.email, m.subject, m.html);
    },
  },

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
      "/request-password-reset": { window: 3600, max: 5 },
      "/send-verification-email": { window: 3600, max: 5 },
      "/reset-password": { window: 3600, max: 10 },
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
    user: {
      create: {
        // Regras do cadastro valem no SERVIDOR (o navegador sozinho não basta): aceite da LGPD e celular.
        before: async (_user, context) => {
          if ((context as { path?: string } | null)?.path !== SIGN_UP) return;
          const body = bodyOf(context);
          if (body.consent !== true && body.consent !== "true") {
            throw new APIError("BAD_REQUEST", {
              message: "É necessário aceitar o uso dos seus dados para criar a conta.",
              code: "CONSENT_REQUIRED",
            });
          }
          const phone = phoneRequired.safeParse(text(body.phone));
          if (!phone.success) {
            throw new APIError("BAD_REQUEST", { message: phone.error.issues[0].message, code: "PHONE_INVALID" });
          }
        },
        // Cria o perfil junto com a conta (funciona mesmo sem sessão, quando o e-mail precisa ser confirmado).
        after: async (user, context) => {
          if ((context as { path?: string } | null)?.path !== SIGN_UP) return;
          const body = bodyOf(context);
          const extras = signUpExtrasSchema.safeParse({
            birthDate: text(body.birthDate),
            sex: text(body.sex) || undefined,
            diabetesType: text(body.diabetesType) || undefined,
            yearsWithDiabetes: text(body.yearsWithDiabetes),
            phone: text(body.phone),
          });
          // dados de saúde são opcionais: se algum vier inválido, guarda só o aceite e o celular
          const phone = phoneRequired.safeParse(text(body.phone));
          const d = extras.success ? extras.data : null;
          await db
            .insert(schema.profiles)
            .values({
              userId: user.id,
              lgpdConsentAt: new Date(),
              phone: phone.success ? phone.data : null,
              birthDate: d?.birthDate ?? null,
              sex: d?.sex ?? null,
              diabetesType: d?.diabetesType ?? null,
              diagnosisYear: yearsToDiagnosisYear(d?.yearsWithDiabetes ?? null),
            })
            .onConflictDoNothing();
        },
      },
    },
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
    // Google reCAPTCHA v2 no cadastro, no login e no pedido de nova senha (evita e-mails em massa).
    ...(captchaEnabled()
      ? [
          captcha({
            provider: "google-recaptcha",
            secretKey: process.env.RECAPTCHA_SECRET_KEY!,
            endpoints: [SIGN_UP, SIGN_IN, "/request-password-reset"],
            // apenas para testes automatizados (aponta para um verificador falso); em produção fica vazio
            siteVerifyURLOverride: process.env.RECAPTCHA_VERIFY_URL || undefined,
          }),
        ]
      : []),
  ],
});
