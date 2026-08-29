import { HaiKind } from "@mahjong-scoring/core";

import type { GlossaryTermEntry } from "../types";

/** アガリと待ちの用語（分類 `agari`） */
export const AGARI_TERMS = [
  {
    slug: "hora",
    category: "agari",
    related: ["ron", "tsumo", "tenpai", "yaku"],
  },
  {
    slug: "ron",
    category: "agari",
    related: ["tsumo", "hora", "menzen-ron-kafu", "minkou"],
    learnSlugs: ["mangan-ko-ron", "mangan-oya-ron"],
  },
  {
    slug: "tsumo",
    category: "agari",
    related: ["ron", "hora", "tsumo-fu", "pinfu"],
    learnSlugs: ["mangan-ko-tsumo", "mangan-oya-tsumo"],
  },
  {
    slug: "tenpai",
    category: "agari",
    related: ["machi", "hora", "riichi", "tehai"],
  },
  {
    slug: "machi",
    category: "agari",
    related: ["ryanmen", "kanchan", "penchan", "shanpon", "tanki"],
    learnSlugs: ["machi-fu"],
  },
  {
    slug: "ryanmen",
    category: "agari",
    examples: [
      {
        tiles: [HaiKind.ManZu3, HaiKind.ManZu4],
        captionKey: "ryanmenWait",
      },
    ],
    related: ["machi", "kanchan", "penchan", "pinfu"],
    learnSlugs: ["machi-fu"],
  },
  {
    slug: "kanchan",
    category: "agari",
    examples: [
      {
        tiles: [HaiKind.PinZu4, HaiKind.PinZu6],
        captionKey: "kanchanWait",
      },
    ],
    related: ["machi", "ryanmen", "penchan", "fu"],
    learnSlugs: ["machi-fu"],
  },
  {
    slug: "penchan",
    category: "agari",
    examples: [
      {
        tiles: [HaiKind.SouZu1, HaiKind.SouZu2],
        captionKey: "penchanWait",
      },
    ],
    related: ["machi", "ryanmen", "kanchan", "fu"],
    learnSlugs: ["machi-fu"],
  },
  {
    slug: "shanpon",
    category: "agari",
    examples: [
      {
        tiles: [HaiKind.ManZu5, HaiKind.ManZu5, HaiKind.PinZu7, HaiKind.PinZu7],
        captionKey: "shanponWait",
      },
    ],
    related: ["machi", "toitsu", "ankou", "minkou"],
    learnSlugs: ["machi-fu"],
  },
  {
    slug: "tanki",
    category: "agari",
    examples: [
      {
        tiles: [HaiKind.SouZu9],
        captionKey: "tankiWait",
      },
    ],
    related: ["machi", "jantou", "chiitoitsu", "fu"],
    learnSlugs: ["machi-fu"],
  },
  {
    slug: "yaku",
    category: "agari",
    related: ["han", "hora", "kuisagari", "dora"],
    learnSlugs: ["yaku"],
  },
  {
    slug: "riichi",
    category: "agari",
    related: ["menzen", "tenpai", "yaku", "han"],
    learnSlugs: ["yaku"],
  },
] as const satisfies readonly GlossaryTermEntry[];
