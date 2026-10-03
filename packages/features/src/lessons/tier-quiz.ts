import { HIGH_SCORES, hanRangeOf } from "@mahjong-scoring/core";

import type { LessonChoice, LessonQuiz } from "./quiz";

/** 満貫以上の帯 1 行（core の `HIGH_SCORES` の要素） */
type HighScoreRow = (typeof HIGH_SCORES)[number];

/**
 * 確認問題で問う帯（出題順）
 *
 * 満貫 → 跳満 → 倍満 の 3 問。基準（満貫）→ 1.5 倍 → 2 倍 と倍率が
 * 素直に進む並びで、三倍満・役満は説明と選択肢で目にするだけに留める。
 * 3 問に収めるのは、1 つのレッスンを「数分で終わる」大きさに保つため。
 * 満貫以上の 4 章（子・親 × ロン・ツモ）は覚える表の形が同じなので、
 * どれも同じ帯を問う。
 */
const QUESTION_TIER_KEYS = ["mangan", "haneman", "baiman"] as const;

/**
 * 満貫以上の点数表の 1 列を問う確認問題を組む
 * 帯の確認問題
 *
 * 翻数（その帯の最小翻数）を示し、表の 1 列（子のロン・子のツモ …）から
 * 点数を選ばせる。選択肢は満貫〜役満の同じ列で、説明に出す早見表と同じ
 * 出所（core の `HIGH_SCORES`）なので、表で見た値がそのまま選択肢に並ぶ。
 * 8000 / 12000 … を直書きしない。
 *
 * @param column 帯の行から、問う列の値を選択肢として取り出す
 */
export function buildTierQuiz(
  column: (row: HighScoreRow) => LessonChoice,
): LessonQuiz {
  return {
    questions: QUESTION_TIER_KEYS.map((tierKey) => {
      const row = HIGH_SCORES.find((entry) => entry.nameKey === tierKey);
      const range = hanRangeOf(tierKey);
      if (row === undefined || range === undefined) {
        throw new Error(`HIGH_SCORES に ${tierKey} の帯がない`);
      }
      return {
        key: tierKey,
        prompt: { kind: "tier", tierKey, han: range.min },
        answer: column(row),
      };
    }),
    choices: HIGH_SCORES.map(column),
  };
}
