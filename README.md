# Glicose Tech

Web app para acompanhar glicemia, alimentação, medicamentos e insulina, com metas próprias,
gráficos, relatórios em PDF e compartilhamento com familiares e médico.

> O app organiza registros. Não diagnostica, não sugere doses e não substitui acompanhamento médico.

Stack: Next.js 16 · TypeScript · Tailwind · shadcn/ui · Neon Postgres · Drizzle · Better Auth · Resend · Recharts · React PDF.

## Rodar localmente

```bash
npm install
cp .env.example .env.local   # preencha DATABASE_URL e BETTER_AUTH_SECRET
npm run db:migrate           # aplica as migrations em ./drizzle
npm run dev
```

## Scripts

| Comando | O que faz |
| --- | --- |
| `npm run lint` / `typecheck` / `test` | Verificações |
| `npm run build` | Build de produção |
| `npm run db:generate` | Gera migration após mudar `src/db/schema` |
| `npm run db:migrate` | Aplica migrations |

Testes de isolamento entre usuários (precisam de um banco **de teste** com migrations aplicadas):

```bash
TEST_DATABASE_URL=postgresql://... npm test
```

## Deploy na Vercel

1. Crie o banco no Neon e rode `npm run db:migrate` com a `DATABASE_URL` dele.
2. Importe o repositório na Vercel e defina as variáveis: `DATABASE_URL`, `BETTER_AUTH_SECRET`,
   `BETTER_AUTH_URL` (domínio final, com `https://`), `RESEND_API_KEY` e `EMAIL_FROM` (opcionais).
3. Para enviar e-mails a qualquer destinatário, verifique seu domínio no Resend.

## Proteção do login

- **Bloqueio por conta:** 5 senhas erradas para o mesmo e-mail travam o login por 15 minutos (vale também para e-mails inexistentes; o e-mail é guardado só como HMAC).
- **Limite por IP:** 10 tentativas de login por minuto e 10 cadastros por hora, guardado no banco (`rate_limits`).
- **CAPTCHA (Google reCAPTCHA v2):** crie as chaves em <https://www.google.com/recaptcha/admin> (tipo *v2 Caixa de seleção*, domínios `localhost` e o do app) e defina `RECAPTCHA_SITE_KEY` (a antiga `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` também funciona) e `RECAPTCHA_SECRET_KEY`. Sem as duas, o captcha fica desligado.

## Segurança e privacidade

- Toda consulta filtra pelo `userId` da sessão; acesso de familiar passa por `getAccessibleModules`.
- Tokens de convite e de link do médico: 256 bits, só o hash fica no banco, com expiração e revogação.
- Links do médico respondem com `no-store`, `no-referrer` e `noindex`.
- O service worker não faz cache: dados de saúde não ficam no cache do navegador.
- Exclusão de conta no Perfil apaga todos os dados (cascade).
