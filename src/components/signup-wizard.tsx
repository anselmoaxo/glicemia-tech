"use client";

import { ArrowLeft, Check } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Recaptcha, type RecaptchaHandle } from "@/components/recaptcha";
import { completeSignup } from "@/app/(auth)/actions";
import { AboutFields, DiabetesFields } from "@/components/health-fields";
import { PhoneField } from "@/components/phone-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { CAPTCHA_REQUIRED, signupErrorMessage } from "@/lib/auth-errors";
import { CAPTCHA_HEADER } from "@/lib/captcha";
import { DIABETES_OPTIONS, SEX_OPTIONS } from "@/lib/profile-utils";
import { normalizePhone, formatPhoneDisplay } from "@/lib/phone";
import { accountStepSchema, healthFieldsSchema, signUpSchema } from "@/lib/validation";

const STEPS = [
  { title: "Crie seu acesso", hint: "Usaremos o e-mail e a senha para você entrar." },
  { title: "Sobre você", hint: "Opcional. Ajuda a montar o relatório para o seu médico." },
  { title: "Sobre o diabetes", hint: "Opcional. Você pode mudar isso depois no Perfil." },
  { title: "Quase lá", hint: "Confira e aceite para criar a conta." },
] as const;
const LAST = STEPS.length - 1;
const OPTIONAL_STEPS = new Set([1, 2]);

const aboutSchema = healthFieldsSchema.pick({ birthDate: true, sex: true });
const diabetesSchema = healthFieldsSchema.pick({ diabetesType: true, yearsWithDiabetes: true });

const label = (opts: readonly { value: string; label: string }[], v: string) =>
  opts.find((o) => o.value === v)?.label ?? "Não informado";

export function SignupWizard({ next = "/inicio", siteKey = "" }: { next?: string; siteKey?: string }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const mounted = useRef(false);
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [summary, setSummary] = useState<[string, string][]>([]);
  const [token, setToken] = useState<string | null>(null);
  const captcha = useRef<RecaptchaHandle>(null);
  const loginHref = `/login${next !== "/inicio" ? `?next=${encodeURIComponent(next)}` : ""}`;

  // Ao trocar de passo, leva o foco ao título (leitores de tela anunciam a mudança).
  useEffect(() => {
    if (mounted.current) headingRef.current?.focus();
    mounted.current = true;
  }, [step]);

  const values = () => Object.fromEntries(new FormData(formRef.current!)) as Record<string, string>;

  function validate(s: number): string | null {
    const v = values();
    const schema = [accountStepSchema, aboutSchema, diabetesSchema][s];
    if (!schema) return null;
    const r = schema.safeParse(v);
    return r.success ? null : r.error.issues[0].message;
  }

  function goNext() {
    const problem = validate(step);
    if (problem) return setError(problem);
    setError(null);
    if (step + 1 === LAST) {
      const v = values();
      const n = v.yearsWithDiabetes;
      setSummary([
        ["Nome", v.name],
        ["E-mail", v.email],
        ["Celular", (() => { const p = normalizePhone(v.phone ?? ""); return p.ok ? formatPhoneDisplay(p.e164) : "Não informado"; })()],
        ["Nascimento", v.birthDate ? v.birthDate.split("-").reverse().join("/") : "Não informado"],
        ["Sexo", label(SEX_OPTIONS, v.sex)],
        ["Tipo de diabetes", label(DIABETES_OPTIONS, v.diabetesType)],
        ["Tempo com diabetes", n === "" || n === undefined ? "Não informado" : n === "0" ? "Menos de 1 ano" : `${n} anos`],
      ]);
    }
    setStep(step + 1);
  }

  function goBack() {
    setError(null);
    setStep(step - 1);
  }

  async function finish() {
    const v = values();
    if (v.consent !== "on") return setError("É necessário aceitar o uso dos seus dados para criar a conta.");
    const account = signUpSchema.parse(v);
    const extras = healthFieldsSchema.safeParse(v);
    if (!extras.success) return setError(extras.error.issues[0].message);
    if (siteKey && !token) return setError(CAPTCHA_REQUIRED);

    setPending(true);
    const res = await authClient.signUp.email(account, {
      headers: siteKey && token ? { [CAPTCHA_HEADER]: token } : undefined,
    });
    if (res.error) {
      setPending(false);
      captcha.current?.reset(); // o token do captcha vale uma vez só
      // erro de captcha ou de limite: fica no último passo; senão (e-mail repetido etc.) volta ao primeiro
      if (!res.error.code?.match(/^(MISSING_RESPONSE|VERIFICATION_FAILED|UNKNOWN_ERROR)$/) && res.error.status !== 429) setStep(0);
      return setError(signupErrorMessage(res.error));
    }
    await completeSignup({
      birthDate: v.birthDate ?? "",
      sex: v.sex ?? "nao_informado",
      diabetesType: v.diabetesType ?? "nao_informado",
      yearsWithDiabetes: v.yearsWithDiabetes ?? "",
      phone: (() => { const p = normalizePhone(v.phone ?? ""); return p.ok ? p.e164 : ""; })(),
    });
    setPending(false);
    router.replace(next);
    router.refresh();
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault(); // Enter avança o passo; só o último passo cria a conta
    if (step < LAST) goNext();
    else void finish();
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} onChange={() => setError(null)} noValidate className="flex flex-col gap-6">
      {/* Esteira de progresso */}
      <div>
        <p className="text-base font-semibold text-muted-foreground">
          Passo {step + 1} de {STEPS.length}
        </p>
        <ol className="mt-2 flex gap-2" aria-label="Progresso do cadastro">
          {STEPS.map((s, i) => (
            <li
              key={s.title}
              aria-current={i === step ? "step" : undefined}
              className={`h-2 flex-1 rounded-full ${i < step ? "bg-ok" : i === step ? "bg-primary" : "bg-border"}`}
            >
              <span className="sr-only">
                {s.title}
                {i < step ? " (concluído)" : i === step ? " (passo atual)" : ""}
              </span>
            </li>
          ))}
        </ol>
        <h2 ref={headingRef} tabIndex={-1} className="mt-5 text-3xl font-bold tracking-tight outline-none">
          {STEPS[step].title}
        </h2>
        <p className="mt-1 text-lg text-muted-foreground">{STEPS[step].hint}</p>
      </div>

      {/* Todos os passos ficam no formulário; os inativos só são escondidos (os valores se mantêm) */}
      <div hidden={step !== 0} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <Label htmlFor="name" className="text-base">Nome</Label>
          <Input id="name" name="name" autoComplete="name" className="h-12 text-base" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="email" className="text-base">E-mail</Label>
          <Input id="email" name="email" type="email" autoComplete="email" className="h-12 text-base" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="password" className="text-base">Senha (mínimo 8 caracteres)</Label>
          <Input id="password" name="password" type="password" autoComplete="new-password" className="h-12 text-base" />
        </div>
        <PhoneField id="w-phone" purpose="Usaremos só para avisos importantes do app, em breve. Sem propaganda." />
      </div>

      <div hidden={step !== 1} className="flex flex-col gap-5">
        <AboutFields idPrefix="w-" />
      </div>

      <div hidden={step !== 2} className="flex flex-col gap-5">
        <DiabetesFields idPrefix="w-" />
      </div>

      <div hidden={step !== LAST} className="flex flex-col gap-5">
        <dl className="divide-y rounded-2xl border bg-background">
          {summary.map(([k, v]) => (
            <div key={k} className="flex flex-col px-4 py-3 sm:flex-row sm:justify-between sm:gap-4">
              <dt className="text-base text-muted-foreground">{k}</dt>
              <dd className="text-lg font-semibold break-all">{v}</dd>
            </div>
          ))}
        </dl>
        {siteKey && step === LAST && <Recaptcha ref={captcha} siteKey={siteKey} onChange={setToken} />}
        <label className="flex items-start gap-3 text-base">
          <input type="checkbox" name="consent" className="mt-1 size-6 shrink-0" />
          <span>
            Concordo com o tratamento dos meus dados de saúde e do meu celular para o funcionamento do app e para o envio de avisos, conforme a LGPD. Posso
            excluir minha conta e meus dados a qualquer momento no Perfil.
          </span>
        </label>
      </div>

      {error && <p role="alert" className="text-base font-medium text-destructive">{error}</p>}

      <div className="flex flex-col gap-3">
        {step < LAST ? (
          <Button type="submit" className="h-14 text-lg">Continuar</Button>
        ) : (
          <Button type="submit" disabled={pending} className="h-14 gap-2 text-lg">
            <Check aria-hidden className="size-5" />
            {pending ? "Criando sua conta..." : "Criar minha conta"}
          </Button>
        )}

        {OPTIONAL_STEPS.has(step) && (
          <button
            type="button"
            onClick={goNext}
            className="flex min-h-12 items-center justify-center rounded-lg text-base font-semibold underline underline-offset-4"
          >
            Pular este passo
          </button>
        )}

        {step > 0 && (
          <button
            type="button"
            onClick={goBack}
            disabled={pending}
            className="flex min-h-12 items-center justify-center gap-2 rounded-lg border-2 text-base font-semibold disabled:opacity-50"
          >
            <ArrowLeft aria-hidden className="size-5" /> Voltar
          </button>
        )}
      </div>

      {step === 0 && (
        <p className="text-center text-base">
          Já tem conta?{" "}
          <Link href={loginHref} className="font-semibold underline underline-offset-4">
            Entrar
          </Link>
        </p>
      )}
    </form>
  );
}
