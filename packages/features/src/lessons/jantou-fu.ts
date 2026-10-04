import {
  HaiKind,
  calculateJantouFu,
  type HaiKindId,
} from "@mahjong-scoring/core";

import type { LessonQuestion, LessonQuiz } from "./quiz";

/** 全問で共通の場風・自風（章の例と同じ東場・南家） */
const BAKAZE = HaiKind.Ton;
const JIKAZE = HaiKind.Nan;

/**
 * 確認問題で問う雀頭（出題順）
 *
 * 章のまとめの表の行（三元牌・場風・自風・数牌とオタ風）を、取り違えやすい
 * 順に確かめる。
 * 1. 三元牌（白）— いつでも 2 符
 * 2. 自風（南）— 場風と違い、席によって変わる
 * 3. オタ風（西）— 風牌でも場風・自風でなければ 0 符
 * 4. 数牌（五筒）— 0 符
 * 場風（東）は自風と同じ理屈で、オタ風との対比は自風で足りるため問わない。
 * 連風牌は設定で 2 符 / 4 符に割れる（章のコラム）ので出題しない。
 */
const QUESTIONS: readonly { readonly key: string; readonly tile: HaiKindId }[] =
  [
    { key: "sangen", tile: HaiKind.Haku },
    { key: "jikaze", tile: HaiKind.Nan },
    { key: "otakaze", tile: HaiKind.Sha },
    { key: "suuhai", tile: HaiKind.PinZu5 },
  ];

/** 全牌種 */
const ALL_TILES: readonly HaiKindId[] = Object.values(HaiKind);

/**
 * 「雀頭の符」レッスンの確認問題
 * 雀頭符レッスン確認問題
 *
 * 場風・自風と雀頭の牌を示して、雀頭の符を選ばせる。符は core の
 * `calculateJantouFu`（雀頭符の練習と同じ計算）から引き、選択肢は同じ
 * 場風・自風で全牌種を雀頭にしたときに現れる符すべて（章のまとめの表の
 * 符の列）。連風牌は既定の扱い（2 符）で数える。
 */
export const JANTOU_FU_LESSON_QUIZ: LessonQuiz = {
  questions: QUESTIONS.map(({ key, tile }): LessonQuestion => ({
    key,
    prompt: { kind: "jantou", tile, bakaze: BAKAZE, jikaze: JIKAZE },
    answer: { kind: "fu", fu: calculateJantouFu(tile, BAKAZE, JIKAZE) },
  })),
  choices: [
    ...new Set(
      ALL_TILES.map((tile) => calculateJantouFu(tile, BAKAZE, JIKAZE)),
    ),
  ]
    .sort((a, b) => a - b)
    .map((fu) => ({ kind: "fu", fu })),
};
