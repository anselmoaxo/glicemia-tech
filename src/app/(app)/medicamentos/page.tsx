import type { Metadata } from "next";
import Link from "next/link";
import { DoseRow } from "@/components/dose-row";
import { dateToLocalInputs } from "@/lib/datetime";
import { getTodayDoses, listMedications } from "@/lib/medications/queries";
import { summarizeSchedule } from "@/lib/medications/schedule";
import { getProfile } from "@/lib/profile";
import { requireUser } from "@/lib/session";
import { setMedicationActive } from "./actions";

export const metadata: Metadata = { title: "Medicamentos" };

export default async function MedicamentosPage() {
  const user = await requireUser();
  const { timezone } = await getProfile(user.id);
  const today = dateToLocalInputs(new Date(), timezone).date;

  const [doses, meds] = await Promise.all([
    getTodayDoses(user.id, today, timezone),
    listMedications(user.id),
  ]);
  const active = meds.filter((m) => m.active);
  const inactive = meds.filter((m) => !m.active);

  return (
    <section className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">Medicamentos</h1>
        <Link
          href="/medicamentos/novo"
          className="flex min-h-14 items-center rounded-lg bg-primary px-5 text-lg font-semibold text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          Novo medicamento
        </Link>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold">Hoje</h2>
        {doses.length === 0 ? (
          <p className="text-base text-muted-foreground">Nenhuma dose prevista para hoje.</p>
        ) : (
          <ul className="flex flex-col gap-4">
            {doses.map((d) => (
              <DoseRow
                key={d.scheduleId}
                scheduleId={d.scheduleId}
                date={today}
                time={d.time}
                name={d.med.name}
                dose={d.med.dose}
                unit={d.med.unit}
                status={d.status}
              />
            ))}
          </ul>
        )}
        <Link href="/medicamentos/historico" className="flex min-h-12 items-center text-base underline underline-offset-4">
          Ver histórico
        </Link>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold">Meus medicamentos</h2>
        {active.length === 0 && <p className="text-base text-muted-foreground">Nenhum medicamento cadastrado.</p>}
        <ul className="flex flex-col gap-4">
          {active.map((m) => (
            <li key={m.id} className="flex flex-col gap-3 rounded-2xl border bg-card p-4">
              <p className="text-xl font-semibold">
                {m.name} <span className="text-base font-normal text-muted-foreground">{m.dose} {m.unit}</span>
              </p>
              <p className="text-base">{summarizeSchedule(m.schedules)}</p>
              {m.notes && <p className="text-base text-muted-foreground">{m.notes}</p>}
              <div className="flex gap-3">
                <Link
                  href={`/medicamentos/${m.id}/editar`}
                  className="flex min-h-12 flex-1 items-center justify-center rounded-lg border-2 text-base font-medium focus-visible:outline-2 focus-visible:outline-ring"
                >
                  Editar
                </Link>
                <form action={setMedicationActive} className="flex-1">
                  <input type="hidden" name="id" value={m.id} />
                  <input type="hidden" name="active" value="false" />
                  <button className="min-h-12 w-full rounded-lg border-2 text-base font-medium focus-visible:outline-2 focus-visible:outline-ring">
                    Desativar
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {inactive.length > 0 && (
        <details className="rounded-2xl border bg-card px-4 py-3">
          <summary className="min-h-10 cursor-pointer text-base font-medium">
            Desativados ({inactive.length})
          </summary>
          <ul className="mt-3 flex flex-col gap-3">
            {inactive.map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-3">
                <span className="text-base">{m.name} · {m.dose} {m.unit}</span>
                <form action={setMedicationActive}>
                  <input type="hidden" name="id" value={m.id} />
                  <input type="hidden" name="active" value="true" />
                  <button className="min-h-12 rounded-lg border-2 px-4 text-base font-medium focus-visible:outline-2 focus-visible:outline-ring">
                    Reativar
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}
