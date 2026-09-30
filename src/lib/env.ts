import { z } from "zod";

// Na Vercel, a URL de produção já vem definida; serve de padrão se BETTER_AUTH_URL não existir.
const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : undefined;

const schema = z.object({
  DATABASE_URL: z.string().min(1),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.string().url(),
});

type Env = z.infer<typeof schema>;

// Durante o build (antes de existir banco/segredos) usamos valores neutros; em runtime a validação é estrita.
const isBuild = process.env.NEXT_PHASE === "phase-production-build";

export const env: Env = isBuild
  ? {
      DATABASE_URL: process.env.DATABASE_URL ?? "",
      BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET ?? "build-placeholder-build-placeholder-0",
      BETTER_AUTH_URL: process.env.BETTER_AUTH_URL ?? vercelUrl ?? "http://localhost:3000",
    }
  : schema.parse({ ...process.env, BETTER_AUTH_URL: process.env.BETTER_AUTH_URL ?? vercelUrl });
