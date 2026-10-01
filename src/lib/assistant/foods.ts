// Valores APROXIMADOS de referência geral (alimento já preparado, como é comido). Variam por marca, receita
// e preparo: o assistente sempre manda conferir o rótulo ou uma tabela confiável (ex.: TACO/Unicamp).
export type Food = {
  key: string;
  name: string;
  /** apelidos já normalizados (minúsculas, sem acento) */
  aliases: string[];
  /** gramas de carboidrato por 100 g (ou 100 ml) */
  carbsPer100: number;
  unitLabel: "g" | "ml";
  /** medida caseira assumida */
  home?: { label: string; plural: string; amount: number; words: string[] };
  note?: string;
};

export const FOODS: Food[] = [
  { key: "arroz_branco", name: "arroz branco cozido", aliases: ["arroz branco", "arroz"], carbsPer100: 28, unitLabel: "g",
    home: { label: "colher de sopa cheia", plural: "colheres de sopa cheias", amount: 25, words: ["colher"] } },
  { key: "arroz_integral", name: "arroz integral cozido", aliases: ["arroz integral"], carbsPer100: 26, unitLabel: "g",
    home: { label: "colher de sopa cheia", plural: "colheres de sopa cheias", amount: 25, words: ["colher"] } },
  { key: "feijao", name: "feijão cozido (com caldo)", aliases: ["feijao"], carbsPer100: 14, unitLabel: "g",
    home: { label: "concha média", plural: "conchas médias", amount: 80, words: ["concha"] } },
  { key: "macarrao", name: "macarrão cozido", aliases: ["macarrao", "espaguete", "massa"], carbsPer100: 30, unitLabel: "g" },
  { key: "pao_frances", name: "pão francês", aliases: ["pao frances", "paes franceses", "paozinho", "paes", "pao"], carbsPer100: 58, unitLabel: "g",
    home: { label: "unidade (50 g)", plural: "unidades (50 g cada)", amount: 50, words: ["unidade", "pao", "paes", "paozinho"] } },
  { key: "pao_forma", name: "pão de forma", aliases: ["pao de forma"], carbsPer100: 49, unitLabel: "g",
    home: { label: "fatia (25 g)", plural: "fatias (25 g cada)", amount: 25, words: ["fatia"] } },
  { key: "batata", name: "batata cozida", aliases: ["batata"], carbsPer100: 18, unitLabel: "g",
    home: { label: "unidade média (130 g)", plural: "unidades médias (130 g cada)", amount: 130, words: ["unidade", "batata"] } },
  { key: "mandioca", name: "mandioca cozida", aliases: ["mandioca", "aipim", "macaxeira"], carbsPer100: 30, unitLabel: "g" },
  { key: "banana", name: "banana prata (sem casca)", aliases: ["banana"], carbsPer100: 26, unitLabel: "g",
    home: { label: "unidade média (70 g)", plural: "unidades médias (70 g cada)", amount: 70, words: ["unidade", "banana"] } },
  { key: "maca", name: "maçã (com casca)", aliases: ["maca"], carbsPer100: 15, unitLabel: "g",
    home: { label: "unidade média (130 g)", plural: "unidades médias (130 g cada)", amount: 130, words: ["unidade", "maca"] } },
  { key: "laranja", name: "laranja (sem casca)", aliases: ["laranja"], carbsPer100: 12, unitLabel: "g",
    home: { label: "unidade média (140 g)", plural: "unidades médias (140 g cada)", amount: 140, words: ["unidade", "laranja"] } },
  { key: "leite", name: "leite integral", aliases: ["leite"], carbsPer100: 4.5, unitLabel: "ml",
    home: { label: "copo (200 ml)", plural: "copos (200 ml cada)", amount: 200, words: ["copo"] } },
  { key: "iogurte", name: "iogurte natural integral (sem açúcar)", aliases: ["iogurte natural", "iogurte"], carbsPer100: 5, unitLabel: "g",
    home: { label: "pote (170 g)", plural: "potes (170 g cada)", amount: 170, words: ["pote"] },
    note: "Iogurtes com açúcar ou frutas têm bem mais carboidrato: confira o rótulo." },
  { key: "aveia", name: "aveia em flocos", aliases: ["aveia"], carbsPer100: 66, unitLabel: "g",
    home: { label: "colher de sopa (15 g)", plural: "colheres de sopa (15 g cada)", amount: 15, words: ["colher"] } },
  { key: "acucar", name: "açúcar refinado", aliases: ["acucar"], carbsPer100: 100, unitLabel: "g",
    home: { label: "colher de chá (5 g)", plural: "colheres de chá (5 g cada)", amount: 5, words: ["colher"] } },
  { key: "mel", name: "mel", aliases: ["mel"], carbsPer100: 82, unitLabel: "g",
    home: { label: "colher de sopa (20 g)", plural: "colheres de sopa (20 g cada)", amount: 20, words: ["colher"] } },
  { key: "suco_laranja", name: "suco de laranja natural (sem açúcar)", aliases: ["suco de laranja"], carbsPer100: 10, unitLabel: "ml",
    home: { label: "copo (200 ml)", plural: "copos (200 ml cada)", amount: 200, words: ["copo"] } },
];

export const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Procura o alimento no texto normalizado, preferindo o apelido mais longo ("arroz integral" antes de "arroz"). */
export function findFood(text: string): Food | null {
  let best: { food: Food; len: number } | null = null;
  for (const food of FOODS) {
    for (const alias of food.aliases) {
      if (new RegExp(`\\b${escapeRe(alias)}\\b`).test(text) && (!best || alias.length > best.len)) {
        best = { food, len: alias.length };
      }
    }
  }
  return best?.food ?? null;
}

export const foodByKey = (key: string) => FOODS.find((f) => f.key === key) ?? null;
