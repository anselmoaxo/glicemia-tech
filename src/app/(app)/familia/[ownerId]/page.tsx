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
import { canManagePlan } from "@/lib/tracking/plan";
import { getOwnerName } from "@/lib/sharing/queries";
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

  const [tz, ownerName, isGuardian] = await Promise.all([getTimezone(ownerId), getOwnerName(ownerId), canManagePlan(viewer.id, ownerId)]);
  const [readings, targets, meals, doses, insulin] = await Promise.all([
    modules.has("glucose") ? listReadings(ownerId, 1) : null,
    modules.has("glucose") ? getTargets(ownerId) : {},
    modules.has("meals") ? listMeals(ownerId, 1) : null,
    modules.has("medications") ? listLogs(ownerId, 1) : null,
    modules.has("insulin") ? listInsulinLogs(ownerId, 1) : null,
  ]);

  return (
    <section className="flex flex-col gap-8">
      <div className="flex items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`/api/foto/${encodeURIComponent(ownerId)}`} alt="" width={56} height={56} className="size-14 rounded-full bg-secondary object-cover" />
        <div>
        <h1 className="text-3xl font-bold">{ownerName}</h1>
        <p className="text-base text-muted-foreground">Somente leitura · últimos registros</p>
        {isGuardian && (
          <a href={`/familia/${encodeURIComponent(ownerId)}/configuracoes`} className="text-base font-semibold underline">Configurar acompanhamento (responsável)</a>
        )}
        </div>
      </div>

      {readings && (
        <div className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold">Glicemia</h2>
          {readings.items.length === 0 && <p className="text-base">Sem registros.</p>}
          <ul className="flex flex-col gap-3">
            {readings.items.map((r) => (
              <Row key={r.id}>
                <span className="text-2xl font-bold">{r.value} mg/dL</span>
                <span>{formatDateTime(r.measuredAt, tz)} · {contextLabel(r.contextKey, r.customLabel)}</span>
                <span className="font-medium">{STATUS_LABEL[classify(r.value, r.contextKey, targets)]}</span>
              </Row>
            ))}
          </ul>
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
