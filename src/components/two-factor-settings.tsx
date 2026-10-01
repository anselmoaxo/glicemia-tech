"use client";

import { Download, ShieldCheck, ShieldOff } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { twoFactorErrorMessage } from "@/lib/auth-errors";

type Props = {
  /** a conta já tem a verificação em duas etapas ligada */
  enabled: boolean;
  /** já existe aplicativo autenticador configurado (e confirmado) */
  hasTotp: boolean;
  /** o envio de e-mail está configurado (permite o código por e-mail) */
  emailAvailable: boolean;
};

type View = "home" | "email-password" | "totp-password" | "totp-scan" | "codes" | "regen-password" | "disable-password";

const secondary =
  "flex min-h-12 w-full items-center justify-center rounded-lg border-2 px-4 text-base font-semibold focus-visible:outline-2 focus-visible:outline-ring";

/** Pede a senha (exigência do servidor para mexer na segurança) e devolve o erro, se houver. */
function PasswordPrompt(p: {
  title: string;
  text: string;
  submitLabel: string;
  danger?: boolean;
  onSubmit: (password: string) => Promise<string | null>;
  onCancel: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const password = String(new FormData(e.currentTarget).get("password") ?? "");
    if (!password) return setError("Digite a sua senha.");
    setPending(true);
    const problem = await p.onSubmit(password);
    setPending(false);
    if (problem) setError(problem);
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
      <h3 className="text-xl font-bold">{p.title}</h3>
      <p className="text-base text-muted-foreground">{p.text}</p>
      <div className="flex flex-col gap-2">
        <Label htmlFor="tf-password" className="text-base">Sua senha</Label>
        <Input id="tf-password" name="password" type="password" autoComplete="current-password" className="h-12 text-base" autoFocus />
      </div>
      {error && <p role="alert" className="text-base font-medium text-destructive">{error}</p>}
      <Button type="submit" disabled={pending} variant={p.danger ? "destructive" : "default"} className="h-14 text-lg">
        {pending ? "Aguarde..." : p.submitLabel}
      </Button>
      <button type="button" onClick={p.onCancel} className={secondary}>Cancelar</button>
    </form>
  );
}

/** Códigos de recuperação: aparecem uma única vez, então a pessoa precisa confirmar que guardou. */
function BackupCodes({ codes, onDone }: { codes: string[]; onDone: () => void }) {
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const text = `Glicose Tech — códigos de recuperação\nCada código vale uma vez. Guarde em lugar seguro.\n\n${codes.join("\n")}\n`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(codes.join("\n"));
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  function download() {
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "glicose-tech-codigos-de-recuperacao.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-xl font-bold">Guarde seus códigos de recuperação</h3>
      <p className="text-base text-muted-foreground">
        Se você perder o celular, cada um destes códigos permite entrar uma vez. <strong>Eles não aparecem de novo.</strong>{" "}
        Anote em papel ou salve em um lugar seguro.
      </p>
      <ul className="grid grid-cols-2 gap-2 rounded-2xl border bg-background p-4" aria-label="Códigos de recuperação">
        {codes.map((c) => (
          <li key={c} className="font-lcd text-lg font-semibold">{c}</li>
        ))}
      </ul>
      <div className="grid grid-cols-2 gap-3">
        <button type="button" onClick={copy} className={secondary}>{copied ? "Copiado!" : "Copiar"}</button>
        <button type="button" onClick={download} className={`${secondary} gap-2`}>
          <Download aria-hidden className="size-5" /> Baixar
        </button>
      </div>
      <label className="flex items-start gap-3 text-base">
        <input type="checkbox" checked={saved} onChange={(e) => setSaved(e.target.checked)} className="mt-1 size-6 shrink-0" />
        <span>Guardei meus códigos em um lugar seguro</span>
      </label>
      <Button type="button" disabled={!saved} onClick={onDone} className="h-14 text-lg">Concluir</Button>
    </div>
  );
}

const group = (s: string) => s.replace(/\s+/g, "").replace(/(.{4})/g, "$1 ").trim();

export function TwoFactorSettings({ enabled, hasTotp, emailAvailable }: Props) {
  const router = useRouter();
  const [view, setView] = useState<View>("home");
  const [setup, setSetup] = useState<{ uri: string; codes: string[] } | null>(null);
  const [codes, setCodes] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  // já confirmou o aplicativo, mas o Perfil ainda não recarregou: o cabeçalho já deve dizer "Ativada"
  const [justEnabled, setJustEnabled] = useState(false);
  const isOn = enabled || justEnabled;

  const home = () => {
    setJustEnabled(false);
    setView("home");
    setSetup(null);
    setCodes([]);
    setError(null);
  };
  const done = () => {
    home();
    router.refresh();
  };

  // ─── ações (todas pedem a senha, exceto confirmar o código do aplicativo) ───
  const enableEmail = async (password: string) => {
    const res = await authClient.twoFactor.enable({ password, method: "otp" } as Parameters<typeof authClient.twoFactor.enable>[0]);
    if (res.error) return twoFactorErrorMessage(res.error);
    done();
    return null;
  };

  const startTotp = async (password: string) => {
    const res = await authClient.twoFactor.enable({ password, method: "totp" } as Parameters<typeof authClient.twoFactor.enable>[0]);
    if (res.error) return twoFactorErrorMessage(res.error);
    const data = res.data as { totpURI?: string; backupCodes?: string[] } | null;
    if (!data?.totpURI) return "Não foi possível gerar o código QR. Tente novamente.";
    setSetup({ uri: data.totpURI, codes: data.backupCodes ?? [] });
    setView("totp-scan");
    return null;
  };

  const regenerate = async (password: string) => {
    const res = await authClient.twoFactor.generateBackupCodes({ password });
    if (res.error) return twoFactorErrorMessage(res.error);
    setCodes((res.data as { backupCodes?: string[] } | null)?.backupCodes ?? []);
    setView("codes");
    return null;
  };

  const disable = async (password: string) => {
    const res = await authClient.twoFactor.disable({ password });
    if (res.error) return twoFactorErrorMessage(res.error);
    done();
    return null;
  };

  async function confirmTotp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const code = String(new FormData(e.currentTarget).get("code") ?? "").replace(/\s+/g, "");
    if (!/^\d{6}$/.test(code)) return setError("O código tem 6 números.");
    setPending(true);
    const res = await authClient.twoFactor.verifyTotp({ code });
    setPending(false);
    if (res.error) return setError(twoFactorErrorMessage(res.error));
    setCodes(setup?.codes ?? []);
    setJustEnabled(true);
    setView("codes");
  }

  const secret = setup ? new URL(setup.uri).searchParams.get("secret") ?? "" : "";

  const heading = (
    <div className="flex items-center gap-3">
      <span aria-hidden className={`grid size-11 shrink-0 place-items-center rounded-full ${isOn ? "bg-ok-soft text-ok" : "bg-secondary text-primary"}`}>
        {isOn ? <ShieldCheck className="size-6" /> : <ShieldOff className="size-6" />}
      </span>
      <div>
        <h2 className="text-xl font-semibold">Verificação em duas etapas</h2>
        <p className={`text-base font-semibold ${isOn ? "text-ok" : "text-muted-foreground"}`}>
          {isOn ? "Ativada" : "Desativada"}
        </p>
      </div>
    </div>
  );

  return (
    <section aria-label="Verificação em duas etapas" className="flex flex-col gap-4 border-t pt-6">
      {heading}

      {view === "home" && !enabled && (
        <>
          <p className="text-base text-muted-foreground">
            Além da senha, pedimos um código a cada entrada. Isso protege seus dados de saúde mesmo se alguém descobrir sua senha. É opcional.
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            {emailAvailable && (
              <div className="flex flex-col gap-3 rounded-2xl border bg-card p-4">
                <h3 className="text-lg font-bold">Código por e-mail</h3>
                <p className="text-base text-muted-foreground">
                  Mais simples. A cada entrada enviamos um código para o seu e-mail. Não precisa instalar nada.
                </p>
                <button type="button" onClick={() => setView("email-password")} className={`${secondary} mt-auto`}>Ativar por e-mail</button>
              </div>
            )}
            <div className="flex flex-col gap-3 rounded-2xl border bg-card p-4">
              <h3 className="text-lg font-bold">Aplicativo autenticador</h3>
              <p className="text-base text-muted-foreground">
                Mais seguro. Um aplicativo no celular (Google Authenticator, Microsoft Authenticator ou Authy) mostra o código.
              </p>
              <button type="button" onClick={() => setView("totp-password")} className={`${secondary} mt-auto`}>Configurar aplicativo</button>
            </div>
          </div>
        </>
      )}

      {view === "home" && enabled && (
        <>
          <p className="text-base">
            Ao entrar, pedimos o código do{" "}
            <strong>{hasTotp ? "aplicativo autenticador" : "e-mail"}</strong>
            {hasTotp && emailAvailable ? " (ou um código enviado por e-mail)" : ""}.
          </p>
          <div className="flex flex-col gap-3">
            {!hasTotp && (
              <button type="button" onClick={() => setView("totp-password")} className={secondary}>Adicionar aplicativo autenticador</button>
            )}
            {hasTotp && (
              <button type="button" onClick={() => setView("regen-password")} className={secondary}>Gerar novos códigos de recuperação</button>
            )}
            <button type="button" onClick={() => setView("disable-password")} className={`${secondary} border-destructive text-destructive`}>
              Desativar a verificação em duas etapas
            </button>
          </div>
        </>
      )}

      {view === "email-password" && (
        <PasswordPrompt
          title="Ativar código por e-mail"
          text="Por segurança, confirme a sua senha. Depois, a cada entrada enviaremos um código para o seu e-mail."
          submitLabel="Ativar"
          onSubmit={enableEmail}
          onCancel={home}
        />
      )}

      {view === "totp-password" && (
        <PasswordPrompt
          title="Configurar aplicativo autenticador"
          text="Por segurança, confirme a sua senha. Em seguida você verá um código QR para ler com o aplicativo."
          submitLabel="Continuar"
          onSubmit={startTotp}
          onCancel={home}
        />
      )}

      {view === "totp-scan" && setup && (
        <form onSubmit={confirmTotp} className="flex flex-col gap-4" noValidate>
          <h3 className="text-xl font-bold">Leia o código QR</h3>
          <ol className="list-decimal space-y-1 pl-5 text-base">
            <li>Instale um aplicativo autenticador no celular (Google Authenticator, Microsoft Authenticator ou Authy).</li>
            <li>No aplicativo, escolha <strong>adicionar conta</strong> e aponte a câmera para o código abaixo.</li>
            <li>Digite aqui o código de 6 números que o aplicativo mostrar.</li>
          </ol>
          <div className="mx-auto rounded-2xl border bg-white p-3">
            <QRCodeSVG value={setup.uri} size={200} level="M" marginSize={2} bgColor="#ffffff" fgColor="#000000" title="Código QR do aplicativo autenticador" />
          </div>
          <details className="rounded-xl border bg-background px-4 py-3">
            <summary className="min-h-10 cursor-pointer text-base font-medium">Não consegue ler o código QR?</summary>
            <p className="mt-2 text-base">Digite esta chave no aplicativo (tipo: baseada em tempo):</p>
            <p className="mt-1 break-all font-lcd text-xl font-semibold">{group(secret)}</p>
          </details>
          <div className="flex flex-col gap-2">
            <Label htmlFor="tf-code" className="text-base">Código de 6 números do aplicativo</Label>
            <Input id="tf-code" name="code" autoComplete="one-time-code" inputMode="numeric" maxLength={7} className="h-16 text-center font-lcd text-3xl font-semibold tracking-widest" />
          </div>
          {error && <p role="alert" className="text-base font-medium text-destructive">{error}</p>}
          <Button type="submit" disabled={pending} className="h-14 text-lg">{pending ? "Conferindo..." : "Confirmar e ativar"}</Button>
          <button type="button" onClick={home} className={secondary}>Cancelar</button>
        </form>
      )}

      {view === "codes" && <BackupCodes codes={codes} onDone={done} />}

      {view === "regen-password" && (
        <PasswordPrompt
          title="Gerar novos códigos de recuperação"
          text="Os códigos antigos deixam de valer. Confirme a sua senha para ver os novos."
          submitLabel="Gerar novos códigos"
          onSubmit={regenerate}
          onCancel={home}
        />
      )}

      {view === "disable-password" && (
        <PasswordPrompt
          title="Desativar a verificação em duas etapas"
          text="A conta voltará a pedir só a senha, o que é menos seguro. Confirme a sua senha para desativar."
          submitLabel="Desativar"
          danger
          onSubmit={disable}
          onCancel={home}
        />
      )}
    </section>
  );
}
