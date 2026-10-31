import type { ScoreRange } from "@mahjong-scoring/core";

import type { CurriculumChapterSlug } from "../../curriculum/registry";
import type { HandShape } from "./hand-shape-param";

/**
 * 和了形の点数計算の出題の絞り込み
 * 点数計算の絞り込み
 *
 * 省略した軸は絞り込まない（役は全部・点数帯は両方・手の形は両方）。
 */
export interface ScorePracticePick {
  /** 出題する役（日本語の役名、OR）。生成器が作れない役は無視される */
  readonly yaku?: readonly string[];
  /** 出題する点数帯 */
  readonly ranges?: readonly ScoreRange[];
  /** 手の形 */
  readonly handShape?: HandShape;
}

/** 章に対応する、カタログ外の練習 1 つ */
export interface LessonScorePractice {
  readonly pick: ScorePracticePick;
  /** ボタンの文言の辞書キー（名前空間付き） */
  readonly labelKey: string;
}

/**
 * 章に対応する、カタログ外の練習（和了形の点数計算の絞り込み）
 * 章の自由練習
 *
 * 点数の計算セクションの章は、章の内容そのままの出題（七対子だけ・平和だけ・
 * 門前の面子手だけ・鳴いた手だけ、いずれも満貫未満）を和了形の点数計算の絞り込みで
 * 持つ。カタログに登録された練習ではないので `practiceLinks`（記録対象・
 * おすすめ導線の前提。`practice/catalog.test.ts` が固定）では指せず、章の
 * 「関連する練習」の末尾にボタンで足す。以前は章本文の末尾に置いていたが、
 * 確認問題の「始める」と押して始めるボタンが 2 つ並ぶため、完了後の導線に
 * 移した。
 *
 * 絞り込みの中身だけをここに持ち、行き先の組み立ては各アプリが持つ（web は
 * URL のクエリ、アプリは盤面へ章の slug を渡す）。
 */
export const LESSON_SCORE_PRACTICES: Readonly<
  Partial<Record<CurriculumChapterSlug, LessonScorePractice>>
> = {
  "chiitoitsu-score": {
    pick: { yaku: ["七対子"], ranges: ["nonMangan"] },
    labelKey: "chiitoitsuScore.learn.practiceCta",
  },
  "pinfu-score": {
    pick: { yaku: ["平和"], ranges: ["nonMangan"] },
    labelKey: "pinfuScore.learn.practiceCta",
  },
  "menzen-mentsu-score": {
    pick: { handShape: "menzen", ranges: ["nonMangan"] },
    labelKey: "menzenMentsuScore.learn.practiceCta",
  },
  "furo-score": {
    pick: { handShape: "furo", ranges: ["nonMangan"] },
    labelKey: "furoScore.learn.practiceCta",
  },
};

/**
 * 章の slug（未検証の文字列でよい）から、その章の絞り込み練習を引く
 * 章の自由練習の取得
 */
export function lessonScorePractice(
  slug: string | undefined,
): LessonScorePractice | undefined {
  if (slug === undefined) return undefined;
  return Object.entries(LESSON_SCORE_PRACTICES).find(
    ([key]) => key === slug,
  )?.[1];
}
