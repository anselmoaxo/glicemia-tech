import { HeartHandshake, NotebookPen, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { GlucoseTrace, TRACE_LAST_VALUE } from "@/components/glucose-trace";
import { Logo } from "@/components/logo";

const facts = [
  { icon: NotebookPen, text: "Glicemia, refeições, remédios e insulina num lugar só." },
  { icon: HeartHandshake, text: "Familiares acompanham só o que você liberar, sem poder alterar." },
  { icon: ShieldCheck, text: "Seus dados de saúde não aparecem para a administração do app." },
];

// Login, cadastro e recuperação de senha. À esquerda (no celular, em cima) o "visor" da marca; à direita o formulário.
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="grid min-h-dvh flex-1 bg-lcd lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <aside className="relative flex flex-col gap-6 overflow-hidden bg-lcd px-5 pt-6 pb-7 text-white sm:px-8 lg:sticky lg:top-0 lg:h-dvh lg:justify-between lg:px-12 lg:py-12">
        <Link href="/" className="self-start rounded-xl" aria-label="Glicose Tech, página inicial">
          <Logo tone="light" />
        </Link>

        <div className="flex flex-col gap-5 lg:gap-10">
          <p className="max-w-[16ch] font-display text-[1.75rem] leading-[1.12] font-extrabold tracking-[-0.01em] text-balance sm:text-4xl lg:text-5xl">
            Seu caderno de glicemia, simples de usar todos os dias.
          </p>

          <figure className="rounded-[1.75rem] lg:border lg:border-white/10 lg:bg-white/[0.04] lg:p-5">
            <div className="hidden items-baseline justify-between gap-3 lg:flex">
              <p className="flex items-baseline gap-2">
                <span className="font-lcd text-5xl leading-none font-semibold text-lcd-ink lg:text-6xl">{TRACE_LAST_VALUE}</span>
                <span className="text-base text-white/70">mg/dL</span>
              </p>
              <span className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-semibold">
                <span aria-hidden className="size-2 rounded-full bg-[#5fd3a0]" />
                Na faixa
              </span>
            </div>
            <GlucoseTrace className="h-auto max-h-20 w-full sm:max-h-24 lg:mt-4 lg:max-h-44" />
            <figcaption className="mt-3 hidden text-sm text-white/65 lg:block">Exemplo de um dia registrado, com a faixa que a própria pessoa define.</figcaption>
          </figure>
        </div>

        <ul className="hidden flex-col gap-4 lg:flex">
          {facts.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-start gap-3 text-base text-white/80">
              <Icon aria-hidden className="mt-0.5 size-5 shrink-0 text-lcd-ink" />
              {text}
            </li>
          ))}
        </ul>
      </aside>

      <main className="flex flex-col bg-card px-5 py-8 sm:px-8 lg:px-16 lg:py-12">
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6">{children}</div>
        <p className="mx-auto mt-10 w-full max-w-md text-base text-muted-foreground">
          <a href="/politica-de-privacidade" className="underline underline-offset-4">Política de Privacidade</a>
        </p>
      </main>
    </div>
  );
}
