import { findFood, foodByKey, normalize, type Food } from "./foods";

// Assistente educativo, sem IA generativa: regras fixas e revisáveis. Não recebe nem usa dados pessoais
// ou medições da pessoa, não guarda a conversa e nunca calcula dose nem sugere conduta clínica.

export type Reply = {
  kind: "greeting" | "emergency" | "dose" | "out_of_scope" | "carbs" | "ask" | "faq" | "unknown";
  text: string;
  /** alimento aguardando a quantidade (o cliente devolve na próxima mensagem) */
  pendingFood?: string;
};

export const OUT_OF_SCOPE =
  "Posso ajudar com dúvidas sobre diabetes, glicose, medições e contagem de carboidratos. Para outros assuntos, não consigo ajudar por aqui. Se quiser, pode me perguntar algo dentro desses temas.";

export const DISCLAIMER =
  "Conteúdo educativo. Não substitui médico, nutricionista ou outro profissional de saúde.";

const GREETING = `Olá! Sou o assistente educativo do Glicose Tech. Posso explicar conceitos sobre diabetes e glicose, ajudar a organizar suas medições e fazer uma estimativa de carboidratos de alimentos e refeições (informe a quantidade e o modo de preparo).\n\n${DISCLAIMER}`;

const EMERGENCY =
  "O que você descreveu pode ser sério. Não consigo orientar tratamento por aqui. Procure atendimento de saúde agora ou ligue para o serviço de emergência local (no Brasil, SAMU: 192). Se houver alguém por perto, peça ajuda imediatamente.";

const DOSE =
  "Não posso calcular dose de insulina, indicar ou alterar medicamentos. Isso depende do seu caso e deve ser definido pelo seu médico ou equipe de saúde. O que posso fazer é ajudar a estimar os carboidratos de uma refeição e explicar como registrar suas medições para levar à consulta.";

const EMERGENCY_RE = [
  /desmai/, /inconsciente/, /convuls/, /nao (esta )?(responde|acorda|reage)/, /dificuldade (para|de) respirar/, /falta de ar/,
  /nao consigo respirar/, /dor (forte )?no peito/, /confus(o|ao) mental/, /muito confus/, /cetoacidose/, /halito (de )?(fruta|cetonico)/,
  /vomit\w* (sem parar|muito|toda hora)/, /(estou|esta|ta) passando mal/, /passando muito mal/, /perdi a consciencia/, /desorientad/,
];

const DOSE_RE = [
  /quant\w+ (de )?(insulina|unidades)/, /(calcul\w+|qual) (a |de |da |minha )?(dose|insulina)/, /\bdose\b/, /unidades? de insulina/,
  /(posso|devo|preciso|vou) (aumentar|diminuir|reduzir|parar|suspender|trocar|tomar|aplicar|dobrar|pular)/,
  /fator de (correcao|sensibilidade)/, /relacao (insulina|carbo)/, /\bbolus\b/, /(aumentar|diminuir|reduzir|suspender|trocar) (a |o |minha |meu )?(insulina|remedio|medicamento|metformina)/,
  /quanto (devo|posso) (tomar|aplicar|usar)/, /receita|prescri/,
];

const SCOPE_WORDS = [
  "diabet", "glicose", "glicemi", "glicem", "insulina", "carboidrat", "carbo", "acucar", "medic", "medir", "medicao", "hemoglobina",
  "glicada", "a1c", "jejum", "hipoglic", "hiperglic", "rotulo", "porcao", "indice glicemico", "glicosimetro", "aplicativo", "registr",
  "pos prandial", "pos-prandial", "adocante", "dieta", "refeicao", "alimento", "comer", "comida", "gramas", "caloria", "fibra",
];

type Faq = { match: RegExp; answer: string };

const FAQ: Faq[] = [
  {
    match: /hipoglic|glicose baixa|acucar baixo/,
    answer:
      "Hipoglicemia é quando a glicose no sangue fica abaixo do que é considerado seguro para a pessoa. Sinais comuns descritos em materiais educativos incluem tremor, suor frio, fome, tontura e confusão. O que fazer e quais valores se aplicam ao seu caso devem ser definidos pelo seu profissional de saúde. Se houver sintomas intensos, desmaio ou convulsão, procure atendimento de emergência (no Brasil, SAMU 192).",
  },
  {
    match: /hiperglic|glicose alta|acucar alto/,
    answer:
      "Hiperglicemia é quando a glicose no sangue fica acima do esperado para a pessoa. Pode causar sede, urina frequente e cansaço. Os limites e a conduta dependem do seu plano de cuidado, definido pelo seu profissional de saúde. Se houver vômitos, dificuldade para respirar, confusão ou mal-estar intenso, procure atendimento de emergência (no Brasil, SAMU 192).",
  },
  {
    match: /hemoglobina glicada|\ba1c\b|hba1c/,
    answer:
      "A hemoglobina glicada (HbA1c) é um exame de sangue que reflete a média da glicose nos últimos 2 a 3 meses. Quem interpreta o resultado e define a meta para você é o seu médico.",
  },
  {
    match: /indice glicemico|carga glicemica/,
    answer:
      "O índice glicêmico compara o quanto um alimento com carboidrato tende a elevar a glicose em relação a um alimento de referência. Ele varia com o preparo, a combinação com outros alimentos e a pessoa. É um conceito de apoio, não substitui a contagem de carboidratos nem a orientação de um nutricionista.",
  },
  {
    match: /contagem de carboidrato|contar carboidrato|o que e carboidrato|o que sao carboidrato/,
    answer:
      "Carboidratos são nutrientes presentes em pães, arroz, massas, frutas, leite e doces, entre outros, e são os que mais influenciam a glicose depois da refeição. A contagem de carboidratos consiste em estimar quantos gramas existem em cada refeição, usando o rótulo, tabelas confiáveis (como a TACO) e medidas caseiras. Como usar essa informação no seu tratamento deve ser definido pelo seu profissional de saúde. Quer estimar algum alimento? Diga o alimento, a quantidade e o modo de preparo.",
  },
  {
    match: /rotulo|tabela nutricional|porcao/,
    answer:
      "Para ler um rótulo: 1) veja o tamanho da porção (em g ou ml) e quantas porções há na embalagem; 2) olhe a linha \"carboidratos totais\" por porção; 3) se for comer mais ou menos que a porção, ajuste proporcionalmente (ex.: o dobro da porção = o dobro de carboidratos). A linha \"açúcares\" já está dentro dos carboidratos totais, não some os dois. Fibras podem ser consideradas à parte, mas isso é orientação do seu nutricionista.",
  },
  {
    match: /tipo 1|tipo 2|tipos de diabetes|diabetes gestacional|o que e diabetes|diabetes mellitus/,
    answer:
      "Diabetes é um grupo de condições em que o corpo tem dificuldade de controlar a glicose no sangue por falta ou má ação da insulina. Os tipos mais citados são: tipo 1 (o corpo produz pouca ou nenhuma insulina), tipo 2 (o corpo usa mal a insulina, mais comum) e gestacional (surge na gravidez). O diagnóstico e o tratamento são feitos por profissionais de saúde; este app não diagnostica.",
  },
  {
    match: /o que e (a )?(glicose|glicemia)|o que significa glicemia/,
    answer:
      "Glicose é o açúcar presente no sangue, principal fonte de energia do corpo. Glicemia é a medida dessa glicose, geralmente em mg/dL, feita com glicosímetro (ponta do dedo), sensor ou exame de sangue. Os valores adequados para você são definidos pelo seu profissional de saúde.",
  },
  {
    match: /jejum|pos prandial|pos-prandial|depois de comer|antes de comer/,
    answer:
      "Medição em jejum é a feita depois de um período sem comer (definido pelo seu profissional); \"pós-prandial\" é a feita algum tempo depois de comer. Anotar o contexto de cada medição (jejum, antes ou depois da refeição) ajuda seu profissional a interpretar o histórico. No app, escolha o contexto ao registrar.",
  },
  {
    match: /como (registr|anot|medir|organiz)|registrar (a )?(medicao|glicemia)|organizar (as )?medicoes/,
    answer:
      "Para organizar suas medições: registre o valor, a data e a hora, o contexto (jejum, antes/depois de comer etc.) e, se quiser, observações como refeição, atividade física ou sintomas. Faça o registro logo depois de medir. Em Relatórios você gera um PDF do período para levar à consulta, e pode definir lembretes em Alertas e lembretes.",
  },
  {
    match: /adocante/,
    answer:
      "Adoçantes são usados para dar sabor doce com pouco ou nenhum carboidrato, mas há tipos diferentes e alguns produtos trazem açúcar na composição. Confira sempre o rótulo e converse com seu nutricionista sobre qual faz sentido para você.",
  },
];

// ── quantidades ────────────────────────────────────────────────────────────

const WORD_NUMBERS: Record<string, number> = {
  um: 1, uma: 1, dois: 2, duas: 2, tres: 3, quatro: 4, cinco: 5, seis: 6, meia: 0.5, meio: 0.5,
};

type Qty = { grams: number; text: string } | { error: string } | null;

function parseQuantity(seg: string, food: Food): Qty {
  const metric = seg.match(/(\d+(?:[.,]\d+)?)\s*(kg|g|gr|gramas?|ml|mililitros?|l|litros?)\b/);
  if (metric) {
    let n = parseFloat(metric[1].replace(",", "."));
    const u = metric[2];
    if (u === "kg" || u.startsWith("l")) n *= 1000;
    if (!(n > 0) || n > 5000) return { error: "A quantidade informada parece fora do comum. Confira o valor." };
    return { grams: n, text: `${Math.round(n * 10) / 10} ${food.unitLabel}` };
  }
  const count = seg.match(/(\d+(?:[.,]\d+)?|\bum\b|\buma\b|\bdois\b|\bduas\b|\btres\b|\bquatro\b|\bcinco\b|\bseis\b|\bmeia\b|\bmeio\b)\s*(\w+)?/);
  if (count && food.home) {
    const raw = count[1].trim();
    const n = /^\d/.test(raw) ? parseFloat(raw.replace(",", ".")) : WORD_NUMBERS[raw];
    const word = count[2] ?? "";
    const matches = food.home.words.some((w) => word.startsWith(w)) || food.aliases.some((a) => a.split(" ").some((p) => word.startsWith(p)));
    if (n > 0 && n <= 50 && matches) {
      const label = n === 1 ? food.home.label : food.home.plural;
      return { grams: n * food.home.amount, text: `${String(n).replace(".", ",")} ${label}` };
    }
  }
  return null;
}

const round1 = (n: number) => (Math.round(n * 10) / 10).toString().replace(".", ",");

function carbsAnswer(segments: string[], pendingFood?: string): Reply | null {
  const items: { food: Food; seg: string }[] = [];
  for (const raw of segments) {
    const food = findFood(raw);
    if (food) items.push({ food, seg: raw });
  }
  // resposta curta ("150 g") a uma pergunta de quantidade anterior
  if (items.length === 0 && pendingFood) {
    const food = foodByKey(pendingFood);
    if (food) items.push({ food, seg: segments.join(" ") });
  }
  if (items.length === 0) return null;

  const missing: Food[] = [];
  const lines: string[] = [];
  let total = 0;
  for (const { food, seg } of items) {
    if (/\bcru\b|\bcrua\b|\bcrus\b/.test(seg) || /frit[oa]s?\b|empanad|a milanesa/.test(seg)) {
      return {
        kind: "ask",
        pendingFood: food.key,
        text: `Os valores que uso para ${food.name} valem para o alimento preparado, sem fritura. Cru, frito ou empanado muda bastante o resultado. Informe a quantidade já pronta para comer (em gramas) e o modo de preparo, ou confira o rótulo.`,
      };
    }
    const q = parseQuantity(seg, food);
    if (q && "error" in q) return { kind: "ask", pendingFood: food.key, text: q.error };
    if (!q) {
      missing.push(food);
      continue;
    }
    const carbs = (q.grams * food.carbsPer100) / 100;
    total += carbs;
    lines.push(`• ${q.text} de ${food.name} ≈ ${round1(carbs)} g de carboidratos (premissa: ${food.carbsPer100} g por 100 ${food.unitLabel})${food.note ? `. ${food.note}` : ""}`);
  }

  if (missing.length > 0) {
    const names = missing.map((f) => f.name).join(", ");
    const known = lines.length ? `Até aqui:\n${lines.join("\n")}\n\n` : "";
    return {
      kind: "ask",
      pendingFood: missing.length === 1 ? missing[0].key : undefined,
      text: `${known}Para estimar, preciso saber a quantidade (em gramas/ml, ou unidades, fatias, colheres) e o modo de preparo de: ${names}. Quanto foi?`,
    };
  }

  const sum = lines.length > 1 ? `\n\nTotal estimado: ≈ ${round1(total)} g de carboidratos.` : "";
  return {
    kind: "carbs",
    text: `${lines.join("\n")}${sum}\n\nÉ apenas uma estimativa, com valores médios de referência e medidas caseiras assumidas. A precisão não é garantida: confira o rótulo da embalagem ou uma tabela confiável (como a TACO). Não uso esse valor para calcular insulina nem para indicar conduta; isso é com seu profissional de saúde.`,
  };
}

// ── ponto de entrada ───────────────────────────────────────────────────────

export function answer(message: string, ctx: { pendingFood?: string } = {}): Reply {
  const text = normalize(message).slice(0, 500);
  if (!text) return { kind: "unknown", text: "Escreva sua pergunta sobre diabetes, glicose, medições ou carboidratos." };

  // 1) urgência vem antes de tudo
  if (EMERGENCY_RE.some((re) => re.test(text))) return { kind: "emergency", text: EMERGENCY };
  // 2) dose, medicamentos e prescrição: nunca
  if (DOSE_RE.some((re) => re.test(text))) return { kind: "dose", text: DOSE };

  if (/^(oi|ola|bom dia|boa tarde|boa noite|e ai|opa)[ !.,?]*$/.test(text)) return { kind: "greeting", text: GREETING };

  // 3) carboidratos de alimentos
  const segments = text.split(/\s*(?:,|;|\+|\bcom\b|\be\b)\s*/).filter(Boolean);
  const hasFood = segments.some((s) => findFood(s));
  const carbs = carbsAnswer(segments, ctx.pendingFood);
  if (carbs && (hasFood || ctx.pendingFood)) return carbs;

  // 4) conteúdo educativo
  const faq = FAQ.find((f) => f.match.test(text));
  if (faq) return { kind: "faq", text: `${faq.answer}\n\n${DISCLAIMER}` };

  // 5) fora do tema: mensagem fixa, sem continuar o assunto
  const inScope = SCOPE_WORDS.some((w) => text.includes(w)) || hasFood;
  if (!inScope) return { kind: "out_of_scope", text: OUT_OF_SCOPE };

  return {
    kind: "unknown",
    text: `Não tenho uma resposta segura para essa pergunta. Posso explicar conceitos (tipos de diabetes, glicemia, HbA1c, índice glicêmico), orientar como registrar medições, ler rótulos e estimar carboidratos de alimentos. Tente reformular ou converse com seu profissional de saúde.\n\n${DISCLAIMER}`,
  };
}
