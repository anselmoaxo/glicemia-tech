"use client";

import { useEffect, useImperativeHandle, useRef, useState } from "react";

// Tipos mínimos da API do Google reCAPTCHA v2.
type Grecaptcha = {
  ready: (cb: () => void) => void;
  render: (el: HTMLElement, opts: Record<string, unknown>) => number;
  reset: (id?: number) => void;
};
declare global {
  interface Window {
    grecaptcha?: Grecaptcha;
  }
}

const SCRIPT_SRC = "https://www.google.com/recaptcha/api.js?render=explicit&hl=pt-BR";
let loader: Promise<Grecaptcha> | null = null;

/** Carrega o script do Google uma única vez. */
function loadRecaptcha(): Promise<Grecaptcha> {
  if (loader) return loader;
  loader = new Promise<Grecaptcha>((resolve, reject) => {
    const ready = () => window.grecaptcha!.ready(() => resolve(window.grecaptcha!));
    if (window.grecaptcha) return ready();
    const s = document.createElement("script");
    s.src = SCRIPT_SRC;
    s.async = true;
    s.defer = true;
    s.onload = ready;
    s.onerror = () => {
      loader = null; // permite tentar de novo
      reject(new Error("recaptcha"));
    };
    document.head.appendChild(s);
  });
  return loader;
}

export type RecaptchaHandle = { reset: () => void };

type Props = {
  siteKey: string;
  /** token válido (uso único) ou null quando expira/é reiniciado */
  onChange: (token: string | null) => void;
  ref?: React.Ref<RecaptchaHandle>;
};

/** Caixa "Não sou um robô" do Google. Cada token vale para uma única verificação: chame reset() após usar. */
export function Recaptcha({ siteKey, onChange, ref }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const widget = useRef<number | null>(null);
  const change = useRef(onChange);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    change.current = onChange;
  });

  useImperativeHandle(ref, () => ({
    reset() {
      if (widget.current !== null) window.grecaptcha?.reset(widget.current);
      change.current(null);
    },
  }));

  useEffect(() => {
    let cancelled = false;
    const el = box.current;
    loadRecaptcha()
      .then((g) => {
        if (cancelled || !el || widget.current !== null) return;
        // O widget normal tem 304 px; em telas estreitas usa o formato compacto para não estourar a largura.
        const compact = el.clientWidth > 0 && el.clientWidth < 310;
        widget.current = g.render(el, {
          sitekey: siteKey,
          size: compact ? "compact" : "normal",
          callback: (token: string) => change.current(token),
          "expired-callback": () => change.current(null),
          "error-callback": () => change.current(null),
        });
        setReady(true);
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
      widget.current = null;
      el?.replaceChildren();
    };
  }, [siteKey]);

  return (
    <div className="flex flex-col gap-2">
      <div ref={box} className="min-h-[78px] max-w-full overflow-hidden" />
      {!ready && !failed && <p className="text-base text-muted-foreground">Carregando verificação de segurança...</p>}
      {failed && (
        <p role="alert" className="text-base font-medium text-destructive">
          Não foi possível carregar a verificação de segurança. Confira sua conexão e recarregue a página.
        </p>
      )}
    </div>
  );
}
