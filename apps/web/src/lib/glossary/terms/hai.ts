import { HaiKind } from "@mahjong-scoring/core";

import type { GlossaryTermEntry } from "../types";

/** 牌の種類の用語（分類 `hai`） */
export const HAI_TERMS = [
  {
    slug: "shuupai",
    category: "hai",
    examples: [
      {
        tiles: [HaiKind.ManZu1, HaiKind.PinZu5, HaiKind.SouZu9],
        captionKey: "threeSuits",
      },
    ],
    related: ["manzu", "pinzu", "souzu", "jihai"],
  },
  {
    slug: "manzu",
    category: "hai",
    examples: [{ tiles: [HaiKind.ManZu1, HaiKind.ManZu5, HaiKind.ManZu9] }],
    related: ["shuupai", "pinzu", "souzu"],
  },
  {
    slug: "pinzu",
    category: "hai",
    examples: [{ tiles: [HaiKind.PinZu1, HaiKind.PinZu5, HaiKind.PinZu9] }],
    related: ["shuupai", "manzu", "souzu"],
  },
  {
    slug: "souzu",
    category: "hai",
    examples: [{ tiles: [HaiKind.SouZu1, HaiKind.SouZu5, HaiKind.SouZu9] }],
    related: ["shuupai", "manzu", "pinzu"],
  },
  {
    slug: "jihai",
    category: "hai",
    examples: [
      {
        tiles: [
          HaiKind.Ton,
          HaiKind.Nan,
          HaiKind.Sha,
          HaiKind.Pei,
          HaiKind.Haku,
          HaiKind.Hatsu,
          HaiKind.Chun,
        ],
        captionKey: "jihaiAll",
      },
    ],
    related: ["kazehai", "sangenpai", "yaochuuhai", "shuupai"],
  },
  {
    slug: "kazehai",
    category: "hai",
    examples: [
      {
        tiles: [HaiKind.Ton, HaiKind.Nan, HaiKind.Sha, HaiKind.Pei],
        captionKey: "kazehaiOrder",
      },
    ],
    related: ["jihai", "sangenpai", "yakuhai"],
  },
  {
    slug: "sangenpai",
    category: "hai",
    examples: [
      {
        tiles: [HaiKind.Haku, HaiKind.Hatsu, HaiKind.Chun],
        captionKey: "sangenpaiOrder",
      },
    ],
    related: ["jihai", "kazehai", "yakuhai"],
  },
  {
    slug: "yakuhai",
    category: "hai",
    examples: [{ tiles: [HaiKind.Haku, HaiKind.Haku, HaiKind.Haku] }],
    related: ["sangenpai", "kazehai", "yaku", "han"],
    learnSlugs: ["yaku"],
  },
  {
    slug: "yaochuuhai",
    category: "hai",
    examples: [
      {
        tiles: [HaiKind.ManZu1, HaiKind.SouZu9, HaiKind.Ton, HaiKind.Haku],
        captionKey: "yaochuuMix",
      },
    ],
    related: ["rotouhai", "jihai", "chunchanpai", "fu"],
    learnSlugs: ["jantou-fu", "mentsu-fu"],
  },
  {
    slug: "rotouhai",
    category: "hai",
    examples: [
      {
        tiles: [
          HaiKind.ManZu1,
          HaiKind.ManZu9,
          HaiKind.PinZu1,
          HaiKind.PinZu9,
          HaiKind.SouZu1,
          HaiKind.SouZu9,
        ],
        captionKey: "rotouhaiAll",
      },
    ],
    related: ["yaochuuhai", "chunchanpai"],
  },
  {
    slug: "chunchanpai",
    category: "hai",
    examples: [
      {
        tiles: [HaiKind.ManZu2, HaiKind.PinZu5, HaiKind.SouZu8],
        captionKey: "chunchanRange",
      },
    ],
    related: ["yaochuuhai", "rotouhai", "fu"],
    learnSlugs: ["mentsu-fu"],
  },
  {
    slug: "dora",
    category: "hai",
    related: ["han", "yaku"],
    learnSlugs: ["yaku"],
  },
] as const satisfies readonly GlossaryTermEntry[];
