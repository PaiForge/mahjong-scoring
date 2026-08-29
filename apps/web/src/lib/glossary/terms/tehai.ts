import { HaiKind } from "@mahjong-scoring/core";

import type { GlossaryTermEntry } from "../types";

/** 暗槓は両端の牌を裏向きに描画する */
const CLOSED_KANTSU_FACE_DOWN = [0, 3];

/** 手牌の構成の用語（分類 `tehai`） */
export const TEHAI_TERMS = [
  {
    slug: "tehai",
    category: "tehai",
    related: ["mentsute", "jantou", "mentsu", "tenpai"],
  },
  {
    slug: "mentsu",
    category: "tehai",
    examples: [
      {
        tiles: [HaiKind.ManZu2, HaiKind.ManZu3, HaiKind.ManZu4],
        captionKey: "shuntsu",
      },
      {
        tiles: [HaiKind.PinZu3, HaiKind.PinZu3, HaiKind.PinZu3],
        captionKey: "koutsu",
      },
      {
        tiles: [HaiKind.SouZu7, HaiKind.SouZu7, HaiKind.SouZu7, HaiKind.SouZu7],
        captionKey: "kantsu",
      },
    ],
    related: ["shuntsu", "koutsu", "kantsu", "mentsute", "jantou"],
    learnSlugs: ["mentsu-fu"],
  },
  {
    slug: "shuntsu",
    category: "tehai",
    examples: [
      {
        tiles: [HaiKind.ManZu2, HaiKind.ManZu3, HaiKind.ManZu4],
        captionKey: "shuntsuManzu",
      },
    ],
    related: ["mentsu", "koutsu", "kantsu", "fu"],
    learnSlugs: ["mentsu-fu"],
  },
  {
    slug: "koutsu",
    category: "tehai",
    examples: [
      {
        tiles: [HaiKind.PinZu3, HaiKind.PinZu3, HaiKind.PinZu3],
        captionKey: "koutsuPinzu",
      },
    ],
    related: ["mentsu", "shuntsu", "kantsu", "ankou", "minkou"],
    learnSlugs: ["mentsu-fu"],
  },
  {
    slug: "kantsu",
    category: "tehai",
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
    related: ["mentsu", "koutsu", "kan", "ankan", "minkan"],
    learnSlugs: ["mentsu-fu"],
  },
  {
    slug: "toitsu",
    category: "tehai",
    examples: [{ tiles: [HaiKind.SouZu6, HaiKind.SouZu6] }],
    related: ["jantou", "chiitoitsu", "shanpon"],
  },
  {
    slug: "jantou",
    category: "tehai",
    examples: [
      { tiles: [HaiKind.PinZu2, HaiKind.PinZu2], captionKey: "jantouZero" },
      { tiles: [HaiKind.Haku, HaiKind.Haku], captionKey: "jantouTwo" },
    ],
    related: ["toitsu", "mentsute", "fu", "tanki"],
    learnSlugs: ["jantou-fu"],
  },
  {
    slug: "mentsute",
    category: "tehai",
    examples: [
      {
        tiles: [
          HaiKind.ManZu2,
          HaiKind.ManZu3,
          HaiKind.ManZu4,
          HaiKind.PinZu5,
          HaiKind.PinZu6,
          HaiKind.PinZu7,
          HaiKind.SouZu3,
          HaiKind.SouZu3,
          HaiKind.SouZu3,
          HaiKind.SouZu7,
          HaiKind.SouZu8,
          HaiKind.SouZu9,
          HaiKind.Haku,
          HaiKind.Haku,
        ],
        captionKey: "mentsuteShape",
      },
    ],
    related: ["mentsu", "jantou", "chiitoitsu", "tehai"],
    learnSlugs: ["tehai-fu"],
  },
  {
    slug: "chiitoitsu",
    category: "tehai",
    examples: [
      {
        tiles: [
          HaiKind.ManZu1,
          HaiKind.ManZu1,
          HaiKind.ManZu4,
          HaiKind.ManZu4,
          HaiKind.PinZu2,
          HaiKind.PinZu2,
          HaiKind.PinZu8,
          HaiKind.PinZu8,
          HaiKind.SouZu5,
          HaiKind.SouZu5,
          HaiKind.SouZu9,
          HaiKind.SouZu9,
          HaiKind.Chun,
          HaiKind.Chun,
        ],
        captionKey: "chiitoitsuShape",
      },
    ],
    related: ["toitsu", "mentsute", "fu", "menzen"],
    learnSlugs: ["chiitoitsu-score"],
  },
] as const satisfies readonly GlossaryTermEntry[];
