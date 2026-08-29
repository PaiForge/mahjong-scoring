import { HaiKind } from "@mahjong-scoring/core";

import type { GlossaryTermEntry } from "../types";

/** 暗槓は両端の牌を裏向きに描画する */
const CLOSED_KANTSU_FACE_DOWN = [0, 3];

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
        tiles: [HaiKind.PinZu8, HaiKind.PinZu8, HaiKind.PinZu8],
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
        tiles: [HaiKind.PinZu8, HaiKind.PinZu8, HaiKind.PinZu8],
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
        tiles: [HaiKind.ManZu4, HaiKind.ManZu5, HaiKind.ManZu6],
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
        tiles: [HaiKind.SouZu5, HaiKind.SouZu5, HaiKind.SouZu5, HaiKind.SouZu5],
        captionKey: "minkanExample",
      },
      {
        tiles: [HaiKind.PinZu7, HaiKind.PinZu7, HaiKind.PinZu7, HaiKind.PinZu7],
        faceDownIndexes: CLOSED_KANTSU_FACE_DOWN,
        captionKey: "ankanExample",
      },
    ],
    related: ["kantsu", "ankan", "minkan", "furo"],
    learnSlugs: ["mentsu-fu"],
  },
  {
    slug: "ankou",
    category: "naki",
    examples: [
      {
        tiles: [HaiKind.ManZu1, HaiKind.ManZu1, HaiKind.ManZu1],
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
        tiles: [HaiKind.ManZu5, HaiKind.ManZu5, HaiKind.ManZu5],
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
        tiles: [HaiKind.PinZu9, HaiKind.PinZu9, HaiKind.PinZu9, HaiKind.PinZu9],
        faceDownIndexes: CLOSED_KANTSU_FACE_DOWN,
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
        tiles: [HaiKind.Chun, HaiKind.Chun, HaiKind.Chun, HaiKind.Chun],
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
