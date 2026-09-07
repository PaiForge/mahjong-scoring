import { HaiKind } from "@mahjong-scoring/core";

import {
  exampleAnkan,
  exampleAnkou,
  exampleChii,
  exampleMinkan,
  exampleMinkou,
} from "@/lib/example-mentsu";

import type { GlossaryTermEntry } from "../types";

/** 鳴きと門前の用語（分類 `naki`） */
export const NAKI_TERMS = [
  {
    slug: "menzen",
    category: "naki",
    related: ["furo", "kuisagari", "menzen-ron-kafu", "riichi"],
    learnSlugs: ["menzen-mentsu-score", "furo-score"],
  },
  {
    slug: "furo",
    category: "naki",
    examples: [
      {
        mentsu: exampleMinkou(HaiKind.PinZu8),
        captionKey: "ponExample",
      },
    ],
    related: ["menzen", "pon", "chii", "kan", "kuisagari"],
    learnSlugs: ["furo-score"],
  },
  {
    slug: "pon",
    category: "naki",
    examples: [
      {
        mentsu: exampleMinkou(HaiKind.PinZu8),
        captionKey: "ponExample",
      },
    ],
    related: ["furo", "chii", "minkou", "koutsu"],
    learnSlugs: ["furo-score"],
  },
  {
    slug: "chii",
    category: "naki",
    examples: [
      {
        mentsu: exampleChii([HaiKind.ManZu4, HaiKind.ManZu5, HaiKind.ManZu6]),
        captionKey: "chiiExample",
      },
    ],
    related: ["furo", "pon", "shuntsu"],
    learnSlugs: ["furo-score"],
  },
  {
    slug: "kan",
    category: "naki",
    examples: [
      {
        mentsu: exampleMinkan(HaiKind.SouZu5),
        captionKey: "minkanExample",
      },
      {
        mentsu: exampleAnkan(HaiKind.PinZu7),
        captionKey: "ankanExample",
      },
    ],
    related: ["kantsu", "ankan", "minkan", "furo", "kandora"],
    learnSlugs: ["mentsu-fu"],
  },
  {
    slug: "ankou",
    category: "naki",
    examples: [
      {
        mentsu: exampleAnkou(HaiKind.ManZu1),
        captionKey: "ankouYaochu",
      },
    ],
    related: ["minkou", "koutsu", "menzen", "fu"],
    learnSlugs: ["mentsu-fu"],
  },
  {
    slug: "minkou",
    category: "naki",
    examples: [
      {
        mentsu: exampleMinkou(HaiKind.ManZu5),
        captionKey: "minkouChunchan",
      },
    ],
    related: ["ankou", "koutsu", "pon", "fu"],
    learnSlugs: ["mentsu-fu"],
  },
  {
    slug: "ankan",
    category: "naki",
    examples: [
      {
        mentsu: exampleAnkan(HaiKind.PinZu9),
        captionKey: "ankanYaochu",
      },
    ],
    related: ["minkan", "kantsu", "kan", "menzen"],
    learnSlugs: ["mentsu-fu"],
  },
  {
    slug: "minkan",
    category: "naki",
    examples: [
      {
        mentsu: exampleMinkan(HaiKind.Chun),
        captionKey: "minkanYaochu",
      },
    ],
    related: ["ankan", "kantsu", "kan", "furo"],
    learnSlugs: ["mentsu-fu"],
  },
  {
    slug: "kuisagari",
    category: "naki",
    related: ["furo", "menzen", "han", "yaku"],
    learnSlugs: ["yaku", "furo-score"],
  },
] as const satisfies readonly GlossaryTermEntry[];
