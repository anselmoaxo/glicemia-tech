"use client";

import { ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { twoFactorErrorMessage } from "@/lib/auth-errors";

type Mode = "totp" | "otp" | "backup";

type Props = {
  /** formas disponíveis para esta conta: "totp" (aplicativo) e/ou "otp" (código por e-mail) */
  methods: string[];
  next: string;
  onBack: () => void;
};

const COPY: Record<Mode, { title: string; hint: string; label: string; digits: boolean }> = {
  totp: {
    title: "Digite o código do aplicativo",
    hint: "Abra o aplicativo autenticador no celular e digite o código de 6 números que aparece para o Glicose Tech.",
    label: "Código de 6 números",
    digits: true,
  },
  otp: {
    title: "Digite o código do e-mail",
    hint: "Enviamos um código de 6 números para o seu e-mail. Ele vale por 3 minutos. Olhe também o spam.",
    label: "Código de 6 números",
    digits: true,
  },
  backup: {
    title: "Use um código de recuperação",
    hint: "Digite um dos códigos de recuperação que você guardou ao ativar. Cada um só pode ser usado uma vez.",
    label: "Código de recuperação",
    digits: false,
  },
};

const RESEND_SECONDS = 30;

/** Segunda etapa do login: código do aplicativo, do e-mail ou de recuperação. */
export function TwoFactorChallenge({ methods, next, onBack }: Props) {
  const router = useRouter();
  const hasTotp = methods.includes("totp");
  const hasOtp = methods.includes("otp");
  const [mode, setMode] = useState<Mode>(hasTotp ? "totp" : "otp");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const sentOnMount = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function sendCode() {
    setError(null);
    setInfo(null);
    const res = await authClient.twoFactor.sendOtp();
    if (res.error) return setError(twoFactorErrorMessage(res.error));
    setInfo("Código enviado. Confira seu e-mail.");
    setCooldown(RESEND_SECONDS);
  }

  // Sem aplicativo configurado, o código por e-mail é o único caminho: envia ao abrir a tela.
  useEffect(() => {
    if (mode === "otp" && !hasTotp && !sentOnMount.current) {
      sentOnMount.current = true;
      void sendCode();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  useEffect(() => inputRef.current?.focus(), [mode]);

  function switchTo(next: Mode) {
    setMode(next);
    setError(null);
    setInfo(null);
    if (next === "otp") void sendCode();
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const raw = String(form.get("code") ?? "");
    const code = mode === "backup" ? raw.trim() : raw.replace(/\s+/g, "");
    const trustDevice = form.get("trust") === "on";
    if (!code) return setError("Digite o código.");
    if (COPY[mode].digits && !/^\d{6}$/.test(code)) return setError("O código tem 6 números.");

    setPending(true);
    const res =
      mode === "totp"
        ? await authClient.twoFactor.verifyTotp({ code, trustDevice })
        : mode === "otp"
          ? await authClient.twoFactor.verifyOtp({ code, trustDevice })
          : await authClient.twoFactor.verifyBackupCode({ code, trustDevice });
    setPending(false);

    if (res.error) {
      const expired = res.error.code === "INVALID_TWO_FACTOR_COOKIE";
      setError(twoFactorErrorMessage(res.error));
      if (expired) setTimeout(onBack, 2500); // a verificação venceu: volta ao início do login
      return;
    }
    router.replace(next);
    router.refresh();
  }

  const c = COPY[mode];

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
      <div className="flex flex-col gap-2">
        <p className="flex items-center gap-2 text-base font-semibold text-muted-foreground">
          <ShieldCheck aria-hidden className="size-5" /> Verificação em duas etapas
        </p>
        <h2 className="text-2xl font-bold tracking-tight">{c.title}</h2>
        <p className="text-lg text-muted-foreground">{c.hint}</p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="code" className="text-base">{c.label}</Label>
        <Input
          ref={inputRef}
          id="code"
          name="code"
          autoComplete="one-time-code"
          inputMode={c.digits ? "numeric" : "text"}
          maxLength={c.digits ? 7 : 20}
          autoCapitalize="none"
          spellCheck={false}
          className="h-16 text-center font-lcd text-3xl font-semibold tracking-widest"
          required
        />
      </div>

      <label className="flex items-start gap-3 text-base">
        <input type="checkbox" name="trust" className="mt-1 size-6 shrink-0" />
        <span>Não pedir o código neste aparelho por 30 dias</span>
      </label>

      {info && <p role="status" className="text-base font-semibold text-ok">{info}</p>}
      {error && <p role="alert" className="text-base font-medium text-destructive">{error}</p>}

      <Button type="submit" disabled={pending} className="h-14 text-lg">
        {pending ? "Conferindo..." : "Confirmar"}
      </Button>

      <div className="flex flex-col gap-1">
        {mode === "otp" && (
          <button
            type="button"
            onClick={() => void sendCode()}
            disabled={cooldown > 0}
            className="flex min-h-12 items-center text-base font-semibold underline underline-offset-4 disabled:no-underline disabled:opacity-60"
          >
            {cooldown > 0 ? `Enviar outro código (aguarde ${cooldown}s)` : "Enviar outro código por e-mail"}
          </button>
        )}
        {mode !== "totp" && hasTotp && (
          <button type="button" onClick={() => switchTo("totp")} className="flex min-h-12 items-center text-base font-semibold underline underline-offset-4">
            Usar o aplicativo autenticador
          </button>
        )}
        {mode !== "otp" && hasOtp && (
          <button type="button" onClick={() => switchTo("otp")} className="flex min-h-12 items-center text-base font-semibold underline underline-offset-4">
            Receber um código por e-mail
          </button>
        )}
        {mode !== "backup" && hasTotp && (
          <button type="button" onClick={() => switchTo("backup")} className="flex min-h-12 items-center text-base font-semibold underline underline-offset-4">
            Usar um código de recuperação
          </button>
        )}
        <button type="button" onClick={onBack} className="flex min-h-12 items-center text-base text-muted-foreground underline underline-offset-4">
          Voltar e entrar de novo
        </button>
      </div>
    </form>
  );
}
