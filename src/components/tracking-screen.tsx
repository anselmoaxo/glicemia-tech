import { TrackingForm } from "@/components/tracking-form";
import { fmtDateTime } from "@/lib/admin-format";
import { emailEnabled } from "@/lib/email-flags";
import { listPlanEvents } from "@/lib/tracking/events";
import { getTrackingContext } from "@/lib/tracking/plan";

/** Tela de configurações de acompanhamento (própria pessoa ou responsável legal confirmado). */
export async function TrackingScreen({ ownerId, forGuardian }: { ownerId: string; forGuardian: boolean }) {
  const [ctx, events] = await Promise.all([getTrackingContext(ownerId), listPlanEvents(ownerId)]);
  const plan = ctx.plan;

  return (
    <div className="flex flex-col gap-10">
      <TrackingForm
        ownerId={ownerId}
        noDiabetes={ctx.purpose === "sem_diabetes"}
        visible={ctx.diabetesVisible}
        emailAvailable={emailEnabled()}
        forGuardian={forGuardian}
        values={{
          specificEnabled: plan?.specificEnabled ?? false,
          daysMask: plan?.measureDaysMask ?? null,
          times: plan?.measureTimes ?? [],
          expectedPerDay: plan?.expectedPerDay ?? null,
          toleranceMin: plan?.toleranceMin ?? null,
          trackMedication: plan?.trackMedication ?? false,
          channelApp: plan?.channelApp ?? false,
          emailMissedMeasure: plan?.emailMissedMeasure ?? false,
          emailMedUnconfirmed: plan?.emailMedUnconfirmed ?? false,
          alertEmailSelf: ctx.alertEmailSelf,
          notifyFamily: ctx.alertEmailFamily,
        }}
      />

      {ctx.diabetesVisible && (
        <section aria-labelledby="hist" className="flex flex-col gap-3">
          <h2 id="hist" className="text-xl font-semibold">Histórico de verificações</h2>
          <p className="text-base text-muted-foreground">
            O que o app verificou nos horários previstos. &ldquo;Sem confirmação&rdquo; apenas indica que não havia registro na
            hora da verificação.
          </p>
          {events.length === 0 && <p className="text-base">Nada por aqui ainda.</p>}
          <ul className="flex flex-col gap-2">
            {events.map((e) => (
              <li key={e.id} className="rounded-2xl border bg-card p-3 text-base">
                <span className="font-semibold">{e.kind === "missed_measurement" ? "Medição prevista" : "Medicamento ou insulina"}</span>
                {" · "}
                {fmtDateTime(e.slotAt)}
                <span className={`block ${e.resolved ? "text-ok" : "text-muted-foreground"}`}>{e.label}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
