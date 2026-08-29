import type { GlossaryTermEntry } from "../types";

/** 符の用語（分類 `fu`） */
export const FU_TERMS = [
  {
    slug: "fu",
    category: "fu",
    related: ["futei", "han", "fu-kiriage", "mentsu"],
    learnSlugs: ["tehai-fu", "mentsu-fu", "jantou-fu", "machi-fu"],
  },
  {
    slug: "futei",
    category: "fu",
    related: ["fu", "mentsute", "chiitoitsu"],
    learnSlugs: ["tehai-fu"],
  },
  {
    slug: "menzen-ron-kafu",
    category: "fu",
    related: ["menzen", "ron", "fu", "futei"],
    learnSlugs: ["tehai-fu", "menzen-mentsu-score"],
  },
  {
    slug: "tsumo-fu",
    category: "fu",
    related: ["tsumo", "fu", "pinfu"],
    learnSlugs: ["tehai-fu"],
  },
  {
    slug: "fu-kiriage",
    category: "fu",
    related: ["fu", "futei", "han"],
    learnSlugs: ["tehai-fu"],
  },
  {
    slug: "pinfu",
    category: "fu",
    related: ["ryanmen", "menzen", "fu", "tsumo-fu"],
    learnSlugs: ["pinfu-score"],
  },
] as const satisfies readonly GlossaryTermEntry[];
