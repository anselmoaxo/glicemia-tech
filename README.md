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

## E-mail com Resend

O app envia e-mail em dois casos: **convite de familiar** e **alerta de glicemia fora da faixa**. Sem configurar nada ele continua funcionando (o link do convite aparece na tela e os alertas por e-mail não saem).

1. **Conta e domínio.** Em <https://resend.com> crie a conta, vá em **Domains > Add Domain** e informe um domínio seu (ex.: `seudominio.com.br`; pode ser um subdomínio, como `avisos.seudominio.com.br`). O Resend mostra registros DNS (SPF, DKIM e, se quiser, DMARC): cadastre-os no provedor do domínio e clique em **Verify**. Domínios `*.vercel.app` não servem, pois não dá para editar o DNS deles.
2. **Chave.** Em **API Keys > Create API Key**, permissão **Sending access**, e copie a chave (`re_...`): ela só aparece uma vez.
3. **Vercel.** Em **Project > Settings > Environment Variables** crie, para *Production* (e *Preview*, se quiser):

   | Nome | Valor | Tipo |
   | --- | --- | --- |
   | `RESEND_API_KEY` | a chave `re_...` | **Sensitive** |
   | `EMAIL_FROM` | `Glicose Tech <avisos@seudominio.com.br>` | comum |

   O endereço do `EMAIL_FROM` deve ser do domínio verificado. Depois faça **Redeploy** (Deployments > ... > Redeploy).
4. **Esqueci minha senha e confirmação do e-mail.** Com a chave configurada, o cadastro envia um e-mail de confirmação e o login ganha o link *Esqueci minha senha* (link de 1 hora, uso único; trocar a senha desconecta os outros aparelhos). Por padrão a confirmação **não** é obrigatória para entrar. Quando os e-mails estiverem chegando, defina `REQUIRE_EMAIL_VERIFICATION=true` e faça Redeploy; antes, marque as contas existentes como confirmadas: `update users set email_verified = true;`.
5. **Testar.** Em *Compartilhar com familiar*, convide um e-mail seu: a mensagem deve chegar. Se aparecer o link na tela em vez de "Convite enviado por e-mail", a chave ou o remetente estão errados (veja *Logs* no painel do Resend).

Atalho: no Marketplace da Vercel existe a integração **Resend**, que cria a `RESEND_API_KEY` no projeto sozinha; ainda assim é preciso verificar o domínio e definir o `EMAIL_FROM`.

Para testar sem domínio, use `EMAIL_FROM=Glicose Tech <onboarding@resend.dev>`: o Resend só entrega para o e-mail da sua própria conta.

## Proteção do login

- **Bloqueio por conta:** 5 senhas erradas para o mesmo e-mail travam o login por 15 minutos (vale também para e-mails inexistentes; o e-mail é guardado só como HMAC).
- **Limite por IP:** 10 tentativas de login por minuto e 10 cadastros por hora, guardado no banco (`rate_limits`).
- **CAPTCHA (Google reCAPTCHA v2):** crie as chaves em <https://www.google.com/recaptcha/admin> (tipo *v2 Caixa de seleção*, domínios `localhost` e o do app) e defina `RECAPTCHA_SITE_KEY` (a antiga `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` também funciona) e `RECAPTCHA_SECRET_KEY`. Sem as duas, o captcha fica desligado.

## Verificação em duas etapas (2FA)

Opcional, ativada pela própria pessoa em **Perfil → Verificação em duas etapas** (pede a senha para ativar, gerar novos códigos ou desativar).

- **Código por e-mail** (mais simples): a cada entrada enviamos um código de 6 números ao e-mail da conta, válido por 3 minutos. Só aparece se o envio de e-mail (Resend) estiver configurado.
- **Aplicativo autenticador** (mais seguro): Google Authenticator, Microsoft Authenticator ou Authy, com código QR (ou chave digitada). A ativação só vale depois de confirmar o primeiro código.
- **Códigos de recuperação:** 10 códigos de uso único, mostrados uma vez ao ativar o aplicativo. Servem se a pessoa perder o celular.
- **"Não pedir neste aparelho por 30 dias"** na tela do código.
- **Proteções:** 5 códigos errados bloqueiam a verificação por 15 minutos; no máximo 5 códigos por e-mail a cada 15 minutos por IP; os códigos de e-mail ficam guardados só como hash.

Atenção: o segredo do aplicativo autenticador e os códigos de recuperação ficam **criptografados com `BETTER_AUTH_SECRET`**. Trocar esse valor invalida os 2FA por aplicativo já configurados (a pessoa precisaria desativar e configurar de novo). Se alguém perder o acesso, o administrador pode remover a verificação direto no banco: `update users set two_factor_enabled = false where email = '...'; delete from two_factors where user_id = '...';`

## Segurança e privacidade

- Toda consulta filtra pelo `userId` da sessão; acesso de familiar passa por `getAccessibleModules`.
- Tokens de convite e de link do médico: 256 bits, só o hash fica no banco, com expiração e revogação.
- Links do médico respondem com `no-store`, `no-referrer` e `noindex`.
- O service worker não faz cache: dados de saúde não ficam no cache do navegador.
- Exclusão de conta no Perfil apaga todos os dados (cascade).
