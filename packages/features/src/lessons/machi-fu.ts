import {
  HaiKind,
  calculateMachiFu,
  type HaiKindId,
  type MachiType,
} from "@mahjong-scoring/core";

import type { LessonQuestion, LessonQuiz } from "./quiz";

/**
 * 確認問題で問う待ち（出題順）
 *
 * 章のまとめの表の 5 つの形を 1 問ずつ、0 符と 2 符が交互に近くなるように
 * 並べる。牌は章の例と変え、例の暗記ではなく形を見て答えさせる。辺張は
 * 章の例（12 の 3 待ち）と逆側の 89 の 7 待ちにして、両端どちらでも辺張に
 * なることを確かめる。ノベタン（単騎として 2 符）は章の注記に留める。
 *
 * 待ちの形は牌から決まるが、符を引くために形を明示して持つ（形と牌の
 * 組み合わせはテストが固定する）。
 */
const QUESTIONS: readonly {
  readonly key: string;
  readonly machiType: MachiType;
  readonly tiles: readonly HaiKindId[];
  readonly agariHai: HaiKindId;
}[] = [
  {
    key: "ryanmen",
    machiType: "Ryanmen",
    tiles: [HaiKind.PinZu3, HaiKind.PinZu4],
    agariHai: HaiKind.PinZu5,
  },
  {
    key: "kanchan",
    machiType: "Kanchan",
    tiles: [HaiKind.ManZu4, HaiKind.ManZu6],
    agariHai: HaiKind.ManZu5,
  },
  {
    key: "penchan",
    machiType: "Penchan",
    tiles: [HaiKind.SouZu8, HaiKind.SouZu9],
    agariHai: HaiKind.SouZu7,
  },
  {
    key: "shanpon",
    machiType: "Shanpon",
    tiles: [HaiKind.ManZu2, HaiKind.ManZu2, HaiKind.Sha, HaiKind.Sha],
    agariHai: HaiKind.Sha,
  },
  {
    key: "tanki",
    machiType: "Tanki",
    tiles: [HaiKind.PinZu7],
    agariHai: HaiKind.PinZu7,
  },
];

/** 待ちの形すべて（選択肢を章のまとめの表の符の列と同じ集合にする） */
const ALL_MACHI_TYPES: readonly MachiType[] = [
  "Ryanmen",
  "Kanchan",
  "Penchan",
  "Shanpon",
  "Tanki",
];

/**
 * 「待ちの符」レッスンの確認問題
 * 待ち符レッスン確認問題
 *
 * 聴牌の形と和了牌を示して、待ち符を選ばせる。符は core の
 * `calculateMachiFu`（待ち符の練習と同じ表）から引き、選択肢は待ちの形
 * すべてに現れる符。
 */
export const MACHI_FU_LESSON_QUIZ: LessonQuiz = {
  questions: QUESTIONS.map(
    ({ key, machiType, tiles, agariHai }): LessonQuestion => ({
      key,
      prompt: { kind: "machi", tiles, agariHai },
      answer: { kind: "fu", fu: calculateMachiFu(machiType) },
    }),
  ),
  choices: [...new Set(ALL_MACHI_TYPES.map(calculateMachiFu))]
    .sort((a, b) => a - b)
    .map((fu) => ({ kind: "fu", fu })),
};
