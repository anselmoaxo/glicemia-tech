"use client";


import { updateProfile, type ProfileState } from "@/app/(app)/perfil/actions";
import { useFormAction } from "@/lib/use-form-action";
import { HealthFields } from "@/components/health-fields";
import { PhoneField } from "@/components/phone-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  name: string;
  email: string;
  phone: string;
  birthDate: string | null;
  sex: string | null;
  diabetesType: string | null;
  yearsWithDiabetes: number | null;
  fontScale: number;
  alertEmailSelf: boolean;
  alertEmailFamily: boolean;
  notificationDetails: boolean;
  trackingPurpose: string | null;
};

const selectClass =
  "h-12 w-full rounded-lg border border-input bg-background px-3 text-base focus-visible:outline-2 focus-visible:outline-ring";

export function ProfileForm(p: Props) {
  const [state, action, pending] = useFormAction<ProfileState>(updateProfile, {});
  return (
    <form onSubmit={action} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name" className="text-base">Nome</Label>
        <Input id="name" name="name" defaultValue={p.name} className="h-12 text-base" required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="email" className="text-base">E-mail</Label>
        <Input id="email" value={p.email} className="h-12 text-base" disabled readOnly />
      </div>
      <PhoneField
        defaultValue={p.phone}
        optional
        purpose="Para avisos importantes do app, em breve. Você pode apagar quando quiser."
      />
      <HealthFields
        defaults={{ birthDate: p.birthDate, sex: p.sex, diabetesType: p.diabetesType, yearsWithDiabetes: p.yearsWithDiabetes }}
      />
      <div className="flex flex-col gap-2">
        <Label htmlFor="trackingPurpose" className="text-base">Por que você acompanha a glicose? (opcional)</Label>
        <select id="trackingPurpose" name="trackingPurpose" defaultValue={p.trackingPurpose ?? ""} className={selectClass}>
          <option value="">Prefiro não informar</option>
          <option value="pessoal">Controle pessoal</option>
          <option value="diabetes">Acompanhamento de diabetes</option>
          <option value="outro">Outra necessidade</option>
          <option value="sem_diabetes">Não tenho diabetes</option>
        </select>
        <p className="text-sm text-muted-foreground">
          Informação sua, usada só para personalizar o app. Não é diagnóstico. Com &quot;Não tenho diabetes&quot;, o app esconde
          insulina e controles de tratamento, sem apagar nenhum registro; dá para mudar quando quiser. O app organiza registros
          e não confirma nem descarta diagnóstico a partir de uma medição.
        </p>
      </div>
      <p className="text-sm text-muted-foreground">
        Menores de 18 anos precisam da confirmação de um responsável legal, feita por e-mail (o app pede ao entrar).
      </p>
      <div className="flex flex-col gap-2">
        <Label htmlFor="fontScale" className="text-base">Tamanho do texto</Label>
        <select id="fontScale" name="fontScale" defaultValue={p.fontScale} className={selectClass}>
          <option value={100}>Normal</option>
          <option value={125}>Grande</option>
          <option value={150}>Muito grande</option>
        </select>
      </div>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-lg font-medium">Alertas por e-mail (valor fora da faixa)</legend>
        <label className="flex min-h-12 items-center gap-3 text-base">
          <input type="checkbox" name="alertEmailSelf" defaultChecked={p.alertEmailSelf} className="size-6" />
          Avisar a mim
        </label>
        <label className="flex min-h-12 items-center gap-3 text-base">
          <input type="checkbox" name="alertEmailFamily" defaultChecked={p.alertEmailFamily} className="size-6" />
          Avisar familiares autorizados a ver minha glicemia
        </label>
        <label className="flex min-h-12 items-start gap-3 text-base">
          <input type="checkbox" name="notificationDetails" defaultChecked={p.notificationDetails} className="mt-1 size-6" />
          <span>
            Mostrar o valor da glicemia no e-mail de aviso
            <span className="block text-sm text-muted-foreground">
              Desligado, o e-mail diz só que há um novo aviso. O assunto e o começo do e-mail podem aparecer na tela bloqueada do
              celular.
            </span>
          </span>
        </label>
        <p className="text-sm text-muted-foreground">
          Avisos por e-mail podem atrasar ou não chegar. Não use o app como único meio de vigilância ou de emergência.
        </p>
      </fieldset>
      {state.error && <p role="alert" className="text-base font-medium text-destructive">{state.error}</p>}
      {state.ok && <p role="status" className="text-base font-medium">Perfil salvo.</p>}
      <Button type="submit" disabled={pending} className="h-14 text-lg">
        {pending ? "Salvando..." : "Salvar"}
      </Button>
    </form>
  );
}
