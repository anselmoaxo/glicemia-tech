"use client";

import { savePlan, type PlanState } from "@/app/(app)/acompanhamento/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WEEKDAYS } from "@/lib/medications/schedule";
import { TOLERANCE_OPTIONS } from "@/lib/tracking/validation";
import { useFormAction } from "@/lib/use-form-action";

export type TrackingFormProps = {
  ownerId: string;
  /** "Não tenho diabetes" marcado: mostra só o interruptor do acompanhamento específico */
  noDiabetes: boolean;
  visible: boolean;
  emailAvailable: boolean;
  forGuardian: boolean;
  values: {
    specificEnabled: boolean;
    daysMask: number | null;
    times: string[];
    expectedPerDay: number | null;
    toleranceMin: number | null;
    trackMedication: boolean;
    channelApp: boolean;
    emailMissedMeasure: boolean;
    emailMedUnconfirmed: boolean;
    alertEmailSelf: boolean;
    notifyFamily: boolean;
  };
};

const select = "h-12 w-full rounded-lg border border-input bg-background px-3 text-base focus-visible:outline-2 focus-visible:outline-ring";
const check = "flex min-h-12 items-center gap-3 text-base";
const SLOTS = 6;

export function TrackingForm(p: TrackingFormProps) {
  const [state, onSubmit, pending] = useFormAction<PlanState>(savePlan.bind(null, p.ownerId), {});
  const v = p.values;
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-8">
      {p.noDiabetes && (
        <fieldset className="flex flex-col gap-2 rounded-2xl border p-4">
          <legend className="px-1 text-lg font-semibold">Acompanhamento específico</legend>
          <p className="text-base text-muted-foreground">
            O perfil está marcado como &ldquo;não tenho diabetes&rdquo;, então os controles de medição, medicamentos e avisos ficam
            ocultos. Se mesmo assim há um acompanhamento orientado por um profissional, você pode ativá-lo.
          </p>
          <label className={check}>
            <input type="checkbox" name="specificEnabled" defaultChecked={v.specificEnabled} className="size-6" />
            Ativar acompanhamento específico
          </label>
        </fieldset>
      )}

      {p.visible && (
        <>
          <p role="note" className="rounded-2xl border bg-card p-4 text-base">
            Estes campos servem para <strong>lembretes e organização</strong>. Preencha somente o que o seu profissional de saúde
            orientou. O app não sugere horários, frequência, doses nem calcula insulina, e nada vem preenchido.
          </p>

          <fieldset className="flex flex-col gap-4">
            <legend className="mb-1 text-xl font-semibold">Quando costumo medir</legend>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Dias da semana">
              {WEEKDAYS.map((d) => (
                <label key={d.value} className="flex min-h-12 min-w-14 items-center justify-center gap-2 rounded-full border-2 px-3 text-base font-semibold has-[:checked]:border-primary has-[:checked]:bg-accent">
                  <input type="checkbox" name="day" value={d.value} defaultChecked={v.daysMask ? Boolean(v.daysMask & (1 << d.value)) : false} className="sr-only" />
                  {d.short}
                </label>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">Sem nenhum dia marcado, os horários valem para todos os dias.</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {Array.from({ length: SLOTS }, (_, i) => (
                <div key={i} className="flex flex-col gap-1">
                  <Label htmlFor={`time${i}`} className="text-sm">Horário {i + 1}</Label>
                  <Input id={`time${i}`} name="time" type="time" defaultValue={v.times[i] ?? ""} className="h-12 text-base" />
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-2 sm:max-w-xs">
              <Label htmlFor="expectedPerDay" className="text-base">Medições previstas por dia (se fizer parte do plano)</Label>
              <Input id="expectedPerDay" name="expectedPerDay" type="number" min={1} max={24} defaultValue={v.expectedPerDay ?? ""} className="h-12 text-base" />
            </div>
          </fieldset>

          <fieldset className="flex flex-col gap-3">
            <legend className="mb-1 text-xl font-semibold">Lembrar quando não houver registro</legend>
            <div className="flex flex-col gap-2 sm:max-w-sm">
              <Label htmlFor="toleranceMin" className="text-base">Após quanto tempo do horário previsto</Label>
              <select id="toleranceMin" name="toleranceMin" defaultValue={v.toleranceMin ?? ""} className={select}>
                <option value="">Não lembrar</option>
                {TOLERANCE_OPTIONS.map((m) => (
                  <option key={m} value={m}>{m} minutos</option>
                ))}
              </select>
            </div>
            <p className="text-sm text-muted-foreground">
              Falta de registro não prova que a pessoa não mediu ou não tomou o medicamento: é só um lembrete para conferir.
            </p>
            <label className={check}>
              <input type="checkbox" name="trackMedication" defaultChecked={v.trackMedication} className="size-6" />
              Acompanhar se registrei os medicamentos e a insulina cadastrados em &ldquo;Medicamentos&rdquo; (horários conforme a prescrição)
            </label>
          </fieldset>
        </>
      )}

      <fieldset className="flex flex-col gap-1">
        <legend className="mb-1 text-xl font-semibold">Como quero ser avisado</legend>
        <label className={check}>
          <input type="checkbox" name="channelApp" defaultChecked={v.channelApp} className="size-6" />
          Avisos dentro do aplicativo (histórico nesta tela)
        </label>
        {p.visible && (
          <>
            <label className={check}>
              <input type="checkbox" name="alertEmailSelf" defaultChecked={v.alertEmailSelf} disabled={!p.emailAvailable} className="size-6" />
              E-mail quando uma medição passar da minha faixa pessoal
            </label>
            <label className={check}>
              <input type="checkbox" name="emailMissedMeasure" defaultChecked={v.emailMissedMeasure} disabled={!p.emailAvailable} className="size-6" />
              E-mail quando uma medição prevista não for registrada
            </label>
            <label className={check}>
              <input type="checkbox" name="emailMedUnconfirmed" defaultChecked={v.emailMedUnconfirmed} disabled={!p.emailAvailable} className="size-6" />
              E-mail quando um medicamento ou insulina ficar sem confirmação
            </label>
          </>
        )}
        <label className={check}>
          <input type="checkbox" name="notifyFamily" defaultChecked={v.notifyFamily} className="size-6" />
          Autorizo avisos para familiares ou acompanhantes que já têm acesso à glicemia
        </label>
        {!p.emailAvailable && <p className="text-sm text-muted-foreground">O envio de e-mail não está configurado neste ambiente.</p>}
        <p className="text-sm text-muted-foreground">
          E-mails de segurança, recuperação de senha e convites são obrigatórios e não aparecem aqui.
        </p>
      </fieldset>

      {state.error && <p role="alert" className="text-base font-medium text-destructive">{state.error}</p>}
      {state.ok && <p role="status" className="text-base font-medium">Configurações salvas.</p>}
      <Button type="submit" disabled={pending} className="h-14 text-lg">
        {pending ? "Salvando..." : p.forGuardian ? "Salvar como responsável" : "Salvar"}
      </Button>
    </form>
  );
}
