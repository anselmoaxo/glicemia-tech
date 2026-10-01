import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Orientações" };

const sections = [
  {
    id: "registrar",
    title: "Como registrar uma medição",
    intro: "Quanto mais completo o registro, mais fácil fica conversar sobre ele depois.",
    items: [
      "Valor: digite o número que aparece no aparelho, em mg/dL, sem vírgula.",
      "Data e hora: o app já sugere o momento atual. Se você mediu antes, ajuste para o horário em que mediu de verdade.",
      "Contexto: escolha quando foi medido, como em jejum, antes da refeição, 1h ou 2h depois da refeição, antes de dormir. Se nenhuma opção servir, use “Outro” e dê um nome.",
      "Depois de salvar, o registro aparece na lista e pode ser corrigido ou excluído quando precisar.",
    ],
  },
  {
    id: "observacoes",
    title: "Observações que ajudam a lembrar",
    intro: "Em “Mais detalhes”, você pode anotar o que aconteceu perto da medição. É só um registro seu.",
    items: [
      "Refeições: o que comeu e a que horas, se quiser lembrar depois.",
      "Atividade física: o que fez e por quanto tempo, por exemplo “caminhada de 30 minutos”.",
      "Sintomas: como você se sentiu, com as suas palavras.",
      "Medicamentos: o que tomou e quando. O Glicose Tech guarda a informação, mas não sugere mudanças. Qualquer ajuste no tratamento é decisão do seu profissional de saúde.",
    ],
  },
  {
    id: "consulta",
    title: "Como se preparar para a consulta",
    intro: "Um resumo organizado ajuda a consulta a render mais.",
    items: [
      "Escolha o período que o profissional pediu, por exemplo as últimas semanas.",
      "Reveja as medições e as observações desse período e corrija o que estiver errado.",
      "Anote suas dúvidas antes da consulta, para não esquecer nenhuma.",
      "Em Relatórios, gere o resumo em PDF ou crie um link temporário para mostrar ao profissional. Quem interpreta os números é ele.",
    ],
  },
  {
    id: "conferir",
    title: "Como conferir se está tudo certo",
    intro: "Um número digitado errado pode confundir a conversa na consulta.",
    items: [
      "Compare o valor digitado com o que aparece no visor do aparelho.",
      "Confira a data e a hora, principalmente se você registrou depois de medir.",
      "Se a medição parecer estranha, leia as instruções do seu aparelho: o manual explica como medir, conservar as tiras e o que fazer se o resultado parecer errado.",
      "Em caso de dúvida sobre um resultado ou sobre como se sente, procure o seu profissional de saúde.",
    ],
  },
];

const link =
  "flex min-h-12 items-center rounded-2xl border-2 bg-card px-4 text-base font-semibold focus-visible:outline-2 focus-visible:outline-ring";

export default function OrientacoesPage() {
  return (
    <section className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Orientações</h1>
        <p className="max-w-prose text-lg text-muted-foreground">
          Um guia rápido para registrar suas medições e levar as informações para a consulta.
        </p>
      </div>

      <nav aria-label="Neste guia" className="grid gap-2 sm:grid-cols-2">
        {sections.map((s) => (
          <a key={s.id} href={`#${s.id}`} className={link}>
            {s.title}
          </a>
        ))}
      </nav>

      {sections.map((s) => (
        <section key={s.id} id={s.id} aria-labelledby={`${s.id}-t`} className="flex scroll-mt-4 flex-col gap-3">
          <h2 id={`${s.id}-t`} className="text-2xl font-bold">{s.title}</h2>
          <p className="max-w-prose text-lg">{s.intro}</p>
          <ul className="flex max-w-prose list-disc flex-col gap-2 pl-6 text-lg">
            {s.items.map((i) => (
              <li key={i}>{i}</li>
            ))}
          </ul>
        </section>
      ))}

      <div className="flex flex-col gap-3 rounded-2xl bg-secondary p-4">
        <p className="text-base">
          <strong>Importante:</strong> o Glicose Tech organiza as suas anotações. Ele não faz diagnóstico, não interpreta
          resultados e não indica remédios, doses, alimentação nem mudanças no tratamento. Quem orienta isso é o seu
          profissional de saúde.
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <Link href="/glicemia/nova" className={link}>Registrar glicemia</Link>
        <Link href="/relatorios" className={link}>Gerar relatório</Link>
        <Link href="/alertas" className={link}>Alertas e lembretes</Link>
      </div>
    </section>
  );
}
