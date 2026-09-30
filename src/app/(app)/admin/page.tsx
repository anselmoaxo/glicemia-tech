import { requireAdmin } from "@/lib/admin";
import { captchaEnabled } from "@/lib/captcha";
import { ACTION_LABEL, fmtDateTime } from "@/lib/admin-format";
import { getOverview } from "@/lib/admin-queries";
import { addDaysStr } from "@/lib/reports/range";
import { dateToLocalInputs } from "@/lib/datetime";

const Stat = ({ label, value, hint }: { label: string; value: number; hint?: string }) => (
  <div className="rounded-2xl border bg-card p-4">
    <dt className="text-base text-muted-foreground">{label}</dt>
    <dd className="font-lcd text-4xl font-semibold">{value}</dd>
    {hint && <p className="text-base text-muted-foreground">{hint}</p>}
  </div>
);

export default async function AdminPage() {
  await requireAdmin();
  const o = await getOverview();

  // últimos 14 dias, incluindo dias sem cadastro
  const today = dateToLocalInputs(new Date(), "America/Sao_Paulo").date;
  const byDay = new Map(o.signups.map((s) => [s.day, s.n]));
  const days = Array.from({ length: 14 }, (_, i) => addDaysStr(today, i - 13)).map((d) => ({ d, n: byDay.get(d) ?? 0 }));
  const peak = Math.max(1, ...days.map((x) => x.n));

  return (
    <div className="flex flex-col gap-8">
      <h1 className="sr-only">Resumo da administração</h1>
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat label="Usuários" value={o.total} hint={`${o.suspended} suspensos`} />
        <Stat label="Novos em 7 dias" value={o.new7} hint={`${o.new30} em 30 dias`} />
        <Stat label="Ativos em 7 dias" value={o.active7} hint="com sessão recente" />
        <Stat label="Medições no total" value={o.readings} hint="apenas a contagem" />
        <Stat label="Links de médico ativos" value={o.shareLinks} />
        <Stat label="Convites pendentes" value={o.pendingInvites} />
      </dl>

      <section aria-labelledby="seguranca" className="rounded-2xl border bg-card p-4">
        <h2 id="seguranca" className="text-xl font-bold">Segurança do login</h2>
        <ul className="mt-2 flex flex-col gap-1 text-base">
          <li>
            CAPTCHA do Google:{" "}
            {captchaEnabled() ? (
              <strong className="text-ok">ativo</strong>
            ) : (
              <strong className="text-high">desativado</strong>
            )}
            {!captchaEnabled() && <span className="text-muted-foreground"> (faltam as chaves RECAPTCHA_SECRET_KEY e NEXT_PUBLIC_RECAPTCHA_SITE_KEY)</span>}
          </li>
          <li>Bloqueio por tentativas: <strong className="text-ok">ativo</strong> (5 senhas erradas = 15 minutos)</li>
          <li>Contas bloqueadas agora: <strong>{o.locked}</strong></li>
        </ul>
      </section>

      {o.failedEmails > 0 && (
        <p role="status" className="rounded-2xl border border-high/30 bg-high-soft p-4 text-base font-medium text-high">
          {o.failedEmails} {o.failedEmails === 1 ? "e-mail falhou" : "e-mails falharam"} nos últimos 7 dias. Confira a chave do
          Resend e o domínio verificado.
        </p>
      )}

      <section aria-labelledby="cadastros">
        <h2 id="cadastros" className="mb-3 text-xl font-bold">Novos cadastros por dia (14 dias)</h2>
        <div className="rounded-2xl border bg-card p-4">
          <ul className="flex h-32 items-end gap-1" aria-label="Gráfico de cadastros por dia">
            {days.map(({ d, n }) => (
              <li key={d} className="flex h-full flex-1 flex-col justify-end" title={`${d.split("-").reverse().join("/")}: ${n}`}>
                <span
                  className="block min-h-1 rounded-t bg-primary"
                  style={{ height: `${(n / peak) * 100}%`, opacity: n === 0 ? 0.2 : 1 }}
                />
              </li>
            ))}
          </ul>
          <p className="mt-2 text-base text-muted-foreground">
            Total no período: {days.reduce((a, x) => a + x.n, 0)} · maior dia: {peak === 1 && days.every((x) => x.n === 0) ? 0 : peak}
          </p>
        </div>
      </section>

      <section aria-labelledby="auditoria">
        <h2 id="auditoria" className="mb-3 text-xl font-bold">Ações administrativas recentes</h2>
        {o.logs.length === 0 ? (
          <p className="text-base text-muted-foreground">Nenhuma ação registrada.</p>
        ) : (
          <ul className="divide-y rounded-2xl border bg-card">
            {o.logs.map((l) => (
              <li key={l.id} className="px-4 py-3 text-base">
                <span className="font-semibold">{ACTION_LABEL[l.action as keyof typeof ACTION_LABEL]}</span>{" "}
                <span className="break-all">{l.targetEmail}</span>
                <span className="block text-muted-foreground">{fmtDateTime(l.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
