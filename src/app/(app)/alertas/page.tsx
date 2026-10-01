import { Info } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { RangeAlertForm } from "@/components/range-alert-form";
import { RemindersManager } from "@/components/reminders-manager";
import { getRangeSettings, listReminders } from "@/lib/alerts/settings";
import { emailEnabled } from "@/lib/email-flags";
import { getProfile } from "@/lib/profile";
import { requireUser } from "@/lib/session";
import { getTrackingContext } from "@/lib/tracking/plan";

export const metadata: Metadata = { title: "Alertas e lembretes" };

export default async function AlertasPage() {
  const user = await requireUser();
  if (!(await getTrackingContext(user.id)).diabetesVisible) {
    return (
      <section className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Alertas e lembretes</h1>
        <p className="rounded-2xl border bg-card p-4 text-base">
          Seu perfil está marcado como &ldquo;não tenho diabetes&rdquo;, então os alertas e lembretes de medição ficam ocultos. Se houver
          um acompanhamento orientado por um profissional, ative-o em <Link href="/acompanhamento" className="underline">Configurações de acompanhamento</Link>.
        </p>
      </section>
    );
  }
  const [range, reminders, profile] = await Promise.all([
    getRangeSettings(user.id),
    listReminders(user.id),
    getProfile(user.id),
  ]);

  return (
    <section className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Alertas e lembretes</h1>
        <p className="max-w-prose text-lg text-muted-foreground">
          São avisos informativos. Eles não diagnosticam e não indicam o que fazer: em caso de dúvida, siga a orientação
          do seu profissional de saúde.
        </p>
      </div>

      <section aria-labelledby="lembretes" className="flex flex-col gap-4">
        <h2 id="lembretes" className="text-2xl font-bold">Lembretes para medir</h2>
        <p className="max-w-prose text-base text-muted-foreground">
          Receba um e-mail no horário que você escolher, para lembrar de medir e registrar. A mensagem não traz nenhum
          dado de saúde.
        </p>
        {!emailEnabled() && (
          <p role="note" className="flex gap-3 rounded-2xl bg-secondary p-4 text-base">
            <Info aria-hidden className="mt-0.5 size-6 shrink-0 text-primary" />
            <span>
              O envio de e-mails ainda não está ligado neste ambiente. Os lembretes ficam salvos e passam a ser enviados
              quando estiver.
            </span>
          </p>
        )}
        <RemindersManager reminders={reminders} defaultTimezone={profile.timezone} />
      </section>

      <section aria-labelledby="faixa" className="flex flex-col gap-4">
        <h2 id="faixa" className="text-2xl font-bold">Faixa pessoal para avisos</h2>
        <p className="max-w-prose text-base text-muted-foreground">
          Escolha o limite inferior e o superior. Use a faixa orientada pelo seu profissional de saúde: o app não
          sugere nenhum valor e nada vem preenchido. Com o aviso desligado ou sem limites, nenhuma medição é avaliada.
        </p>
        <RangeAlertForm settings={range} />
        <p className="text-sm text-muted-foreground">
          Esta faixa é só para o aviso na tela. As faixas que marcam os registros ficam em{" "}
          <Link href="/metas" className="underline">Metas</Link>.
        </p>
      </section>
    </section>
  );
}
