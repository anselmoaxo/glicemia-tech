import {
  ALargeSmall,
  Bell,
  Bot,
  Eye,
  Hand,
  FileText,
  Lock,
  Pill,
  ShieldCheck,
  Smartphone,
  Syringe,
  Target,
  Users,
  Utensils,
  type LucideIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/logo";
import { MeterPanel } from "@/components/meter-panel";
import { getSession } from "@/lib/session";

export const metadata: Metadata = {
  title: { absolute: "Glicose Tech · Caderno de glicemia simples e gratuito" },
  description:
    "Registre glicemia, refeições, remédios e insulina em poucos segundos. Gráficos, relatório em PDF e compartilhamento com família e médico. Feito para ser fácil de ler.",
};

const btnPrimary =
  "inline-flex min-h-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-brand-500 px-7 text-lg font-bold text-primary-foreground shadow-md shadow-brand-600/30 transition-opacity hover:opacity-90";
const btnSecondary =
  "inline-flex min-h-14 items-center justify-center rounded-2xl border-2 border-primary px-7 text-lg font-bold transition-colors hover:bg-accent";

const steps = [
  { title: "Registre", text: "Digite o valor, escolha quando mediu e salve. Data e hora já vêm preenchidas." },
  {
    title: "Acompanhe",
    text: "Veja média, menor e maior valor e um gráfico de 7 a 90 dias, sempre comparados à faixa que você definiu.",
  },
  { title: "Compartilhe", text: "Gere um relatório ou um link temporário para o médico." },
];

const features: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: Target, title: "Metas só suas", text: "Você define a faixa. O app destaca o que ficar fora, sem impor metas." },
  { icon: Utensils, title: "Refeições", text: "Anote o que comeu e quando. Sem contar calorias nem complicar." },
  {
    icon: Pill,
    title: "Remédios do dia",
    text: "Cadastre horários e dias da semana e responda Tomei ou Não tomei. Tudo fica no histórico.",
  },
  {
    icon: Syringe,
    title: "Insulina",
    text: "Registre unidades, tipo, local e relação com a refeição. O app nunca sugere doses.",
  },
  {
    icon: FileText,
    title: "Relatório em PDF",
    text: "7, 14, 30 ou 90 dias, ou o período que quiser, pronto para levar à consulta.",
  },
  {
    icon: Bell,
    title: "Avisos e lembretes",
    text: "Defina lembretes para medir e, se quiser, um aviso por e-mail quando um valor sair da faixa que você configurou.",
  },
  {
    icon: Bot,
    title: "Assistente de dúvidas",
    text: "Tire dúvidas sobre diabetes, glicose e contagem de carboidratos. É educativo: não diagnostica nem calcula insulina.",
  },
  {
    icon: Users,
    title: "Leve ao médico",
    text: "Leve o relatório ou um link temporário ao seu médico, com validade e revogação quando quiser.",
  },
];

const readable: { icon: LucideIcon; text: string }[] = [
  { icon: Eye, text: "Números da glicemia em fonte desenhada para baixa visão" },
  { icon: Hand, text: "Botões grandes, fáceis de tocar" },
  { icon: ALargeSmall, text: "Texto ajustável: normal, grande ou muito grande" },
  { icon: Smartphone, text: "Funciona no celular e pode ser instalado na tela inicial" },
];

const privacy = [
  "Cada pessoa só vê os próprios dados.",
  "Links para o médico têm validade e você pode revogar quando quiser.",
  "Menores de 18 anos só usam o app com a confirmação de um responsável legal.",
  "Você exporta uma cópia dos seus dados e exclui a conta a qualquer momento.",
  "O assistente não lê suas medições e a conversa com ele não é guardada.",
  "A equipe do app vê apenas contagens, nunca suas medições.",
];

export default async function Home() {
  if (await getSession()) redirect("/inicio");

  return (
    <>
      <a
        href="#principal"
        className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:rounded-lg focus:bg-background focus:p-3 focus:text-base focus:font-semibold"
      >
        Pular para o conteúdo
      </a>

      <header className="bg-background">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4">
          <Link href="/" className="flex min-h-16 items-center" aria-label="Glicose Tech, página inicial">
            <Logo />
          </Link>
          <nav aria-label="Acesso" className="flex items-center">
            <Link href="/login" className="flex min-h-12 items-center whitespace-nowrap rounded-full px-3 text-base font-semibold hover:bg-secondary sm:px-4">
              Entrar
            </Link>
            <Link
              href="/cadastro"
              className="flex min-h-12 items-center whitespace-nowrap rounded-full bg-primary px-3 text-base font-bold text-primary-foreground hover:bg-primary/90 sm:px-5"
            >
              Criar conta
            </Link>
          </nav>
        </div>
      </header>

      <main id="principal" className="flex-1">
        {/* Herói: a promessa e o visor */}
        <section className="bg-gradient-to-b from-secondary to-background">
          <div className="mx-auto grid max-w-5xl items-center gap-10 px-4 py-10 lg:grid-cols-2 lg:py-16">
          <div className="flex flex-col gap-6">
            <h1 className="text-5xl leading-[1.05] font-bold tracking-tight sm:text-6xl">
              Registre sua glicemia em poucos segundos.
            </h1>
            <p className="max-w-xl text-xl leading-relaxed text-muted-foreground">
              Um caderno digital simples para acompanhar glicemia, refeições, remédios e insulina. Grande, claro e fácil
              de usar em qualquer idade.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/cadastro" className={btnPrimary}>
                Criar conta grátis
              </Link>
              <Link href="/login" className={btnSecondary}>
                Já tenho conta
              </Link>
            </div>
            <p className="text-base text-muted-foreground">Gratuito, direto no navegador do celular ou do computador.</p>
          </div>

          <div className="flex flex-col gap-2">
            <MeterPanel
              value={112}
              status="in_range"
              caption="Exemplo · hoje, 07:30 · Jejum"
              target={{ min: 70, max: 180 }}
              metasHref="/cadastro"
            />
            <p className="px-2 text-base text-muted-foreground">
              Assim o app mostra sua última medição e onde ela fica dentro da faixa que você configurou.
            </p>
          </div>
          </div>
        </section>

        {/* Como funciona: é uma sequência real */}
        <section aria-labelledby="como" className="bg-card py-14">
          <div className="mx-auto max-w-5xl px-4">
            <h2 id="como" className="text-3xl font-bold tracking-tight sm:text-4xl">Como funciona</h2>
            <ol className="mt-8 grid gap-8 md:grid-cols-3">
              {steps.map((s, i) => (
                <li key={s.title} className="flex gap-4">
                  <span
                    aria-hidden
                    className="grid size-11 shrink-0 place-items-center rounded-full bg-primary text-xl font-bold text-primary-foreground"
                  >
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="text-xl font-bold">{s.title}</h3>
                    <p className="mt-1 text-lg leading-relaxed text-muted-foreground">{s.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Recursos */}
        <section aria-labelledby="recursos" className="mx-auto max-w-5xl px-4 py-14">
          <h2 id="recursos" className="text-3xl font-bold tracking-tight sm:text-4xl">Tudo do seu acompanhamento num só lugar</h2>
          <ul className="mt-8 grid gap-x-10 md:grid-cols-2">
            {features.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-4 border-t py-6">
                <span aria-hidden className="grid size-12 shrink-0 place-items-center rounded-full bg-secondary text-primary">
                  <Icon className="size-6" />
                </span>
                <div>
                  <h3 className="text-xl font-bold">{title}</h3>
                  <p className="mt-1 text-lg leading-relaxed text-muted-foreground">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Legibilidade */}
        <section aria-labelledby="legivel" className="bg-card py-14">
          <div className="mx-auto grid max-w-5xl items-center gap-10 px-4 lg:grid-cols-2">
            <div>
              <h2 id="legivel" className="text-3xl font-bold tracking-tight sm:text-4xl">
                Pensado para quem precisa ler sem esforço
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                Cada tela tem poucos passos, textos claros e contraste alto. Quem cuida de um familiar mais velho
                consegue ensinar em minutos.
              </p>
            </div>
            <ul className="flex flex-col gap-3">
              {readable.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-4 rounded-2xl border bg-background p-4 text-lg font-semibold">
                  <Icon aria-hidden className="size-6 shrink-0 text-primary" />
                  {text}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Privacidade e limites */}
        <section aria-labelledby="privacidade" className="mx-auto max-w-5xl px-4 py-14">
          <div className="flex items-center gap-3">
            <ShieldCheck aria-hidden className="size-8 text-primary" />
            <h2 id="privacidade" className="text-3xl font-bold tracking-tight sm:text-4xl">Seus dados de saúde ficam com você</h2>
          </div>
          <ul className="mt-6 grid gap-3 md:grid-cols-2">
            {privacy.map((t) => (
              <li key={t} className="flex gap-3 text-lg leading-relaxed">
                <Lock aria-hidden className="mt-1 size-5 shrink-0 text-primary" />
                {t}
              </li>
            ))}
          </ul>
          <p className="mt-8 flex gap-3 rounded-2xl border bg-card p-5 text-lg leading-relaxed">
            <Users aria-hidden className="mt-1 size-6 shrink-0 text-primary" />
            <span>
              O Glicose Tech organiza seus registros. Ele <strong>não faz diagnóstico</strong>, <strong>não sugere
              doses de insulina</strong> e <strong>não substitui o acompanhamento médico</strong>.
            </span>
          </p>
        </section>

        {/* Chamada final */}
        <section aria-labelledby="comecar" className="bg-lcd py-14 text-white">
          <div className="mx-auto flex max-w-5xl flex-col items-start gap-6 px-4">
            <h2 id="comecar" className="max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
              Comece a registrar hoje.
            </h2>
            <p className="max-w-xl text-xl text-white/80">Leva menos de um minuto para criar a conta e anotar a primeira medição.</p>
            <Link
              href="/cadastro"
              className="inline-flex min-h-14 items-center justify-center rounded-2xl bg-lcd-ink px-7 text-lg font-bold text-lcd transition-opacity hover:opacity-90"
            >
              Criar conta grátis
            </Link>
          </div>
        </section>
      </main>

      <footer className="bg-background">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-8 text-base text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>Glicose Tech · registros informados pelo usuário; não substitui orientação médica.</p>
          <nav aria-label="Rodapé" className="flex gap-4">
            <Link href="/login" className="flex min-h-12 items-center underline underline-offset-4">Entrar</Link>
            <Link href="/cadastro" className="flex min-h-12 items-center underline underline-offset-4">Criar conta</Link>
            <Link href="/politica-de-privacidade" className="flex min-h-12 items-center underline underline-offset-4">Privacidade</Link>
          </nav>
        </div>
      </footer>
    </>
  );
}
