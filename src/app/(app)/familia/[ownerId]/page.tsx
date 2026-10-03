import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { formatDateTime } from "@/lib/datetime";
import { classify, STATUS_LABEL } from "@/lib/glucose/classify";
import { contextLabel } from "@/lib/glucose/contexts";
import { getTargets, listReadings } from "@/lib/glucose/queries";
import { formatUnits, relationLabel } from "@/lib/insulin/options";
import { listInsulinLogs } from "@/lib/insulin/queries";
import { listMeals } from "@/lib/meals/queries";
import { mealLabel } from "@/lib/meals/types";
import { listLogs } from "@/lib/medications/queries";
import { getTimezone } from "@/lib/profile";
import { requireUser } from "@/lib/session";
import { getAccessibleModules } from "@/lib/sharing/access";
import { getRecentAlerts } from "@/lib/alerts/service";
import { isActiveGuardian } from "@/lib/sharing/manage";
import { listSharedWithMe } from "@/lib/sharing/queries";
import { isStale, majorityStatus, registeredLater, STALE_HOURS } from "@/lib/sharing/rules";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { logAccess } from "@/lib/privacy/access-log";

export const metadata: Metadata = { title: "Acompanhamento", robots: { index: false } };

const Row = ({ children }: { children: React.ReactNode }) => (
  <li className="flex flex-col gap-1 rounded-2xl border bg-card p-4 text-base">{children}</li>
);

export default async function FamiliaOwnerPage({ params }: PageProps<"/familia/[ownerId]">) {
  const viewer = await requireUser();
  const { ownerId } = await params;
  // ids de usuário não são UUID (Better Auth), então apenas limitamos o tamanho
  if (!ownerId || ownerId.length > 64 || ownerId === viewer.id) notFound();

  const modules = await getAccessibleModules(viewer.id, ownerId);
  if (modules.size === 0) notFound();
  await logAccess(ownerId, viewer.id, "acompanhamento");

  const [tz, following, isGuardian] = await Promise.all([getTimezone(ownerId), listSharedWithMe(viewer.id), isActiveGuardian(viewer.id, ownerId)]);
  const ownerName = following.find((o) => o.ownerId === ownerId)?.ownerName ?? "Usuário";
  const [readings, targets, alerts, meals, doses, insulin] = await Promise.all([
    modules.has("glucose") ? listReadings(ownerId, 1) : null,
    modules.has("glucose") ? getTargets(ownerId) : {},
    modules.has("glucose") ? getRecentAlerts(ownerId, 7, 5) : [],
    modules.has("meals") ? listMeals(ownerId, 1) : null,
    modules.has("medications") ? listLogs(ownerId, 1) : null,
    modules.has("insulin") ? listInsulinLogs(ownerId, 1) : null,
  ]);

  const latest = readings?.items[0] ?? null;
  const [ownerProfile] = isGuardian
    ? await db.select({ birthDate: profiles.birthDate }).from(profiles).where(eq(profiles.userId, ownerId))
    : [];
  const majority = ownerProfile ? majorityStatus(ownerProfile.birthDate) : null;
  const now = new Date();

  return (
    <section className="flex flex-col gap-8">
      {following.length > 1 && (
        <nav aria-label="Trocar de perfil acompanhado" className="flex flex-col gap-2">
          <p className="text-sm font-medium text-muted-foreground">Você acompanha {following.length} perfis. Trocar para:</p>
          <ul className="flex flex-wrap gap-2">
            {following.map((o) => (
              <li key={o.ownerId}>
                <a
                  href={`/familia/${encodeURIComponent(o.ownerId)}`}
                  aria-current={o.ownerId === ownerId ? "page" : undefined}
                  className="flex min-h-12 items-center rounded-full border-2 px-4 text-base font-semibold aria-[current=page]:border-primary aria-[current=page]:bg-primary aria-[current=page]:text-primary-foreground"
                >
                  {o.ownerName}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}

      <div className="flex items-center gap-4 rounded-2xl border-2 border-primary bg-card p-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`/api/foto/${encodeURIComponent(ownerId)}`} alt="" width={56} height={56} className="size-14 shrink-0 rounded-full bg-secondary object-cover" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground">Você está vendo os dados de</p>
          <h1 className="break-words text-3xl font-bold">{ownerName}</h1>
          <p className="text-base text-muted-foreground">Somente leitura · últimos registros</p>
          {isGuardian && (
            <div className="mt-1 flex flex-col">
              <a href={`/familia/${encodeURIComponent(ownerId)}/configuracoes`} className="flex min-h-12 items-center text-base font-semibold underline">
                Configurar acompanhamento (responsável)
              </a>
              <a href={`/familia/${encodeURIComponent(ownerId)}/compartilhamento`} className="flex min-h-12 items-center text-base font-semibold underline">
                Quem acompanha {ownerName} (responsável)
              </a>
            </div>
          )}
        </div>
      </div>

      {majority?.kind === "soon" && (
        <p role="note" className="rounded-2xl border bg-secondary p-4 text-base">
          Faltam {majority.daysTo18} {majority.daysTo18 === 1 ? "dia" : "dias"} para {ownerName} completar 18 anos. Depois disso,
          {" "}{ownerName} passa a controlar o próprio perfil e decide se você continua com acesso.
        </p>
      )}

      <p className="text-sm text-muted-foreground">
        Os dados aparecem aqui quando {ownerName} registra no app; não é monitoramento em tempo real. Avisos por e-mail podem
        atrasar ou não chegar: não use o app como único meio de vigilância ou emergência. Em caso de sinais graves, procure
        atendimento de emergência (SAMU 192).
      </p>

      {readings && (
        <div className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold">Glicemia</h2>
          {latest && isStale(latest.measuredAt, now) && (
            <p role="status" className="rounded-2xl border-2 border-destructive/40 bg-card p-3 text-base font-medium">
              O último registro tem mais de {STALE_HOURS} horas ({formatDateTime(latest.measuredAt, tz)}). Não é um valor atual.
            </p>
          )}
          {readings.items.length === 0 && <p className="text-base">Sem registros.</p>}
          <ul className="flex flex-col gap-3">
            {readings.items.map((r) => (
              <Row key={r.id}>
                <span className="text-2xl font-bold">{r.value} mg/dL</span>
                <span>Medido em {formatDateTime(r.measuredAt, tz)} · {contextLabel(r.contextKey, r.customLabel)}</span>
                {registeredLater(r.measuredAt, r.createdAt) && (
                  <span className="text-muted-foreground">Registrado no app em {formatDateTime(r.createdAt, tz)}</span>
                )}
                <span className="font-medium">{STATUS_LABEL[classify(r.value, r.contextKey, targets)]}</span>
              </Row>
            ))}
          </ul>
        </div>
      )}

      {alerts.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold">Avisos dos últimos 7 dias</h2>
          <ul className="flex flex-col gap-3">
            {alerts.map((a) => (
              <Row key={a.id}>
                <span className="font-semibold">{a.value} mg/dL, {a.direction === "low" ? "abaixo" : "acima"} da faixa configurada</span>
                <span>Medido em {formatDateTime(a.measuredAt, tz)}</span>
              </Row>
            ))}
          </ul>
          <p className="text-sm text-muted-foreground">
            Aviso para conferir a medição e seguir a orientação recebida do profissional de saúde. A faixa é definida por quem é
            acompanhado (ou pelo responsável) e o app não interpreta nem recomenda conduta.
          </p>
        </div>
      )}

      {meals && (
        <div className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold">Alimentação</h2>
          {meals.items.length === 0 && <p className="text-base">Sem registros.</p>}
          <ul className="flex flex-col gap-3">
            {meals.items.map((m) => (
              <Row key={m.id}>
                <span className="font-semibold">{mealLabel(m.mealType, m.customType)} · {formatDateTime(m.eatenAt, tz)}</span>
                <span className="text-muted-foreground">{m.description}</span>
              </Row>
            ))}
          </ul>
        </div>
      )}

      {doses && (
        <div className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold">Medicamentos</h2>
          {doses.items.length === 0 && <p className="text-base">Sem registros.</p>}
          <ul className="flex flex-col gap-3">
            {doses.items.map((l) => (
              <Row key={l.id}>
                <span className="font-semibold">{l.name} · {l.dose} {l.unit}</span>
                <span>{formatDateTime(l.scheduledFor, tz)} · {l.status === "taken" ? "Tomou" : "Não tomou"}</span>
              </Row>
            ))}
          </ul>
        </div>
      )}

      {insulin && (
        <div className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold">Insulina</h2>
          {insulin.items.length === 0 && <p className="text-base">Sem registros.</p>}
          <ul className="flex flex-col gap-3">
            {insulin.items.map((l) => (
              <Row key={l.id}>
                <span className="font-semibold">{formatUnits(l.units)} unidades · {l.typeName}</span>
                <span>{formatDateTime(l.appliedAt, tz)} · {relationLabel(l.mealRelation)}</span>
              </Row>
            ))}
          </ul>
        </div>
      )}

      {modules.has("reports") && (
        <a
          href={`/api/relatorio?owner=${encodeURIComponent(ownerId)}&dias=30`}
          className="flex min-h-14 items-center justify-center rounded-lg border-2 text-lg font-semibold focus-visible:outline-2 focus-visible:outline-ring"
        >
          Baixar relatório (30 dias, PDF)
        </a>
      )}
    </section>
  );
}
