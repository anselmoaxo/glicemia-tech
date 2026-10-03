import { CircleAlert, CircleCheck, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { captchaEnabled } from "@/lib/captcha";
import { ACTION_LABEL, fmtDateTime } from "@/lib/admin-format";
import { getOverview } from "@/lib/admin-queries";
import { addDaysStr } from "@/lib/reports/range";
import { dateToLocalInputs, formatLongDate } from "@/lib/datetime";
import { emailEnabled, emailVerificationRequired } from "@/lib/email-flags";

const WEEKDAY = ["D", "S", "T", "Q", "Q", "S", "S"];

/** Linha de estado: ícone e cor juntos com o texto (nunca só a cor). */
const Status = ({ on, children, hint }: { on: boolean; children: React.ReactNode; hint?: string }) => {
  const Icon: LucideIcon = on ? CircleCheck : CircleAlert;
  return (
    <li className="flex items-start gap-3 py-3">
      <Icon aria-hidden className={`mt-0.5 size-5 shrink-0 ${on ? "text-ok" : "text-high"}`} />
      <span>
        {children}
        {!on && hint && <span className="block text-sm [overflow-wrap:anywhere] text-muted-foreground">{hint}</span>}
      </span>
    </li>
  );
};

/** Item da lista "Para conferir": número à esquerda, o que é, e o link para resolver quando existe uma tela para isso. */
const Todo = ({ n, label, href }: { n: number; label: string; href?: string }) => {
  const body = (
    <>
      <span className={`font-lcd w-12 shrink-0 text-3xl font-semibold ${n === 0 ? "text-muted-foreground/60" : "text-foreground"}`}>{n}</span>
      <span className={`flex-1 ${n === 0 ? "text-muted-foreground" : "font-semibold"}`}>{label}</span>
    </>
  );
  return (
    <li>
      {href && n > 0 ? (
        <Link href={href} className="flex min-h-16 items-center gap-3 rounded-xl px-3 hover:bg-secondary">
          {body}
          <span className="text-base font-semibold text-primary">Abrir</span>
        </Link>
      ) : (
        <div className="flex min-h-16 items-center gap-3 px-3">{body}</div>
      )}
    </li>
  );
};

export default async function AdminPage() {
  await requireAdmin();
  const o = await getOverview();

  // últimos 14 dias, incluindo dias sem cadastro
  const now = new Date();
  const today = dateToLocalInputs(now, "America/Sao_Paulo").date;
  const byDay = new Map(o.signups.map((s) => [s.day, s.n]));
  const days = Array.from({ length: 14 }, (_, i) => addDaysStr(today, i - 13)).map((d) => ({ d, n: byDay.get(d) ?? 0 }));
  const peak = Math.max(1, ...days.map((x) => x.n));
  const total14 = days.reduce((a, x) => a + x.n, 0);
  const pending = o.openRequests + o.pendingPros + o.failedEmails;

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-4xl font-extrabold tracking-tight">Resumo</h1>
        <p className="text-lg text-muted-foreground first-letter:uppercase">{formatLongDate(now, "America/Sao_Paulo")}</p>
      </header>

      <section aria-labelledby="contas" className="rounded-[1.75rem] bg-lcd p-5 text-white sm:p-7">
        <h2 id="contas" className="sr-only">Contas</h2>
        <dl className="grid grid-cols-3 gap-4">
          {[
            { label: "Contas", value: o.total, hint: `${o.paused} pausadas` },
            { label: "Novas em 7 dias", value: o.new7, hint: `${o.new30} em 30 dias` },
            { label: "Acessaram em 7 dias", value: o.active7, hint: "com sessão recente" },
          ].map((s) => (
            <div key={s.label} className="flex flex-col gap-1">
              <dt className="text-sm text-white/70 sm:text-base">{s.label}</dt>
              <dd className="font-lcd text-4xl leading-none font-semibold text-lcd-ink sm:text-6xl">{s.value}</dd>
              <dd className="text-sm text-white/60">{s.hint}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-7 border-t border-white/10 pt-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="text-base font-semibold">Novos cadastros por dia</h3>
            <p className="text-sm text-white/60">{total14} nos últimos 14 dias</p>
          </div>
          <table className="sr-only">
            <caption>Novos cadastros por dia nos últimos 14 dias</caption>
            <tbody>
              {days.map(({ d, n }) => (
                <tr key={d}><th scope="row">{d.split("-").reverse().join("/")}</th><td>{n}</td></tr>
              ))}
            </tbody>
          </table>
          <ul aria-hidden className="mt-4 flex h-28 items-end gap-1.5 sm:gap-2">
            {days.map(({ d, n }) => {
              const wd = new Date(`${d}T12:00:00`).getDay();
              return (
                <li key={d} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5" title={`${d.split("-").reverse().join("/")}: ${n}`}>
                  {n > 0 && <span className="font-lcd text-xs text-white/70">{n}</span>}
                  <span className={`block w-full rounded-md ${n === 0 ? "h-1 bg-white/15" : "bg-lcd-ink"}`} style={n ? { height: `${(n / peak) * 72}%` } : undefined} />
                  <span className={`text-xs ${d === today ? "font-bold text-white" : "text-white/50"}`}>{WEEKDAY[wd]}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section aria-labelledby="conferir" className="flex flex-col gap-3">
          <h2 id="conferir" className="text-2xl font-bold">Para conferir</h2>
          <p className="text-base text-muted-foreground">
            {pending === 0 ? "Nada esperando por você agora." : "Pedidos e falhas que esperam uma ação da administração."}
          </p>
          <ul className="divide-y rounded-2xl border bg-card p-1">
            <Todo n={o.openRequests} label="Solicitações abertas (suporte, privacidade, exclusão)" href="/admin/solicitacoes" />
            <Todo n={o.pendingPros} label="Registros profissionais a conferir" href="/admin/profissionais" />
            <Todo n={o.failedEmails} label="E-mails que falharam em 7 dias" href="/admin/emails" />
          </ul>
        </section>

        <section aria-labelledby="saude-contas" className="flex flex-col gap-3">
          <h2 id="saude-contas" className="text-2xl font-bold">Situação das contas</h2>
          <p className="text-base text-muted-foreground">Só dados de conta; o painel nunca mostra registros de saúde.</p>
          <ul className="divide-y rounded-2xl border bg-card p-1">
            <Todo n={o.with2fa} label="Com verificação em duas etapas" />
            <Todo n={o.unverified} label="Com e-mail não confirmado" href="/admin/usuarios" />
            <Todo n={o.pendingInvites} label="Convites de familiar pendentes" />
            <Todo n={o.locked} label="Bloqueadas agora por tentativas de senha" />
          </ul>
        </section>
      </div>

      <section aria-labelledby="config" className="flex flex-col gap-3">
        <h2 id="config" className="text-2xl font-bold">Configuração</h2>
        <p className="text-base text-muted-foreground">Mostra só se cada recurso está configurado; os valores das chaves nunca aparecem aqui.</p>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border bg-card px-4 py-2">
            <h3 className="pt-2 text-lg font-bold">Segurança do login</h3>
            <ul className="divide-y text-base">
              <Status on={captchaEnabled()} hint="Faltam as chaves RECAPTCHA_SITE_KEY e RECAPTCHA_SECRET_KEY.">
                CAPTCHA do Google {captchaEnabled() ? "ativo" : "desativado"}
              </Status>
              <Status on>Bloqueio por tentativas ativo: 5 senhas erradas bloqueiam por 15 minutos</Status>
              <Status on>Verificação em duas etapas obrigatória para administradores</Status>
            </ul>
          </div>
          <div className="rounded-2xl border bg-card px-4 py-2">
            <h3 className="pt-2 text-lg font-bold">Integrações</h3>
            <ul className="divide-y text-base">
              <Status on={emailEnabled()} hint="Falta RESEND_API_KEY.">E-mail (Resend) {emailEnabled() ? "configurado" : "não configurado"}</Status>
              <Status on={emailVerificationRequired()} hint="Ligue com REQUIRE_EMAIL_VERIFICATION.">
                Confirmação de e-mail {emailVerificationRequired() ? "obrigatória" : "não obrigatória"}
              </Status>
              <Status on={Boolean(process.env.CRON_SECRET)} hint="Falta CRON_SECRET.">
                Lembretes por e-mail (agendador) {process.env.CRON_SECRET ? "configurados" : "não configurados"}
              </Status>
            </ul>
          </div>
        </div>
      </section>

      <section aria-labelledby="auditoria" className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="auditoria" className="text-2xl font-bold">Ações recentes da administração</h2>
          <Link href="/admin/auditoria" className="flex min-h-11 items-center text-base font-semibold text-primary underline-offset-4 hover:underline">
            Ver auditoria
          </Link>
        </div>
        {o.logs.length === 0 ? (
          <p className="text-base text-muted-foreground">Nenhuma ação registrada.</p>
        ) : (
          <ol className="divide-y rounded-2xl border bg-card">
            {o.logs.map((l) => (
              <li key={l.id} className="flex flex-col gap-0.5 px-4 py-3 text-base sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
                <span>
                  <span className="font-semibold">{ACTION_LABEL[l.action as keyof typeof ACTION_LABEL]}</span>{" "}
                  <span className="[overflow-wrap:anywhere]">{l.targetEmail}</span>
                </span>
                <time dateTime={l.createdAt.toISOString()} className="shrink-0 text-sm text-muted-foreground">{fmtDateTime(l.createdAt)}</time>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
