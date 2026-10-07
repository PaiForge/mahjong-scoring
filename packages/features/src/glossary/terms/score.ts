import type { GlossaryTermEntry } from "../types";

/** 点数と翻の用語（分類 `score`） */
export const SCORE_TERMS = [
  {
    slug: "han",
    category: "score",
    related: ["fu", "yaku", "dora", "mangan"],
    learnSlugs: ["yaku"],
  },
  {
    slug: "oya",
    category: "score",
    related: ["ko", "honba", "mangan"],
    learnSlugs: ["mangan-oya-ron", "mangan-oya-tsumo"],
  },
  {
    slug: "ko",
    category: "score",
    related: ["oya", "honba", "mangan"],
    learnSlugs: ["mangan-ko-ron", "mangan-ko-tsumo"],
  },
  {
    slug: "mangan",
    category: "score",
    related: ["haneman", "kiriage-mangan", "han", "fu"],
    learnSlugs: ["mangan-ko-ron", "mangan-oya-ron"],
  },
  {
    slug: "haneman",
    category: "score",
    related: ["mangan", "baiman", "han"],
  },
  {
    slug: "baiman",
    category: "score",
    related: ["haneman", "sanbaiman", "han"],
  },
  {
    slug: "sanbaiman",
    category: "score",
    related: ["baiman", "kazoe-yakuman", "han"],
  },
  {
    slug: "kazoe-yakuman",
    category: "score",
    related: ["sanbaiman", "yakuman", "han"],
  },
  {
    slug: "yakuman",
    category: "score",
    related: ["kazoe-yakuman", "yaku", "han"],
  },
  {
    slug: "kiriage-mangan",
    category: "score",
    related: ["mangan", "fu", "han"],
  },
  {
    slug: "honba",
    category: "score",
    related: ["oya", "ko", "hora"],
  },
  {
    slug: "bazoro",
    category: "score",
    related: ["han", "fu", "mangan"],
  },
] as const satisfies readonly GlossaryTermEntry[];
