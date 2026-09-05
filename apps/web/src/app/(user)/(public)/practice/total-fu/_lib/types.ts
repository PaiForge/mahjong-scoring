import {
  PRACTICE_SLUG,
  resultStorageKeyFor,
} from "@/lib/db/practice-menu-types";

/** sessionStorage に保存する際のキー */
export const RESULT_STORAGE_KEY = resultStorageKeyFor(PRACTICE_SLUG.totalFu);

/**
 * 合計符の出題の生成リトライ予算
 * 出題リトライ予算
 *
 * 合計符の出題は1回の試行あたり約44%しか成立せず（牌の残数不足・役なしの手を
 * 弾くため。5万回の実測で失敗率56.5%）、`retryGenerate` の既定予算10では
 * 約0.33%/問で生成に失敗する。失敗した問題は盤面がプレースホルダのまま固まり、
 * チャレンジのタイマーだけが進む。100 なら失敗確率は 2e-25 で実質ゼロになり、
 * 平均試行回数は2〜3回のままなので生成コストも増えない。
 *
 * 同じジェネレータを使う昇級試験（手牌の合計符）も同じ理由で 100 を取って
 * いる。値が一致しているのは偶然ではなく同一ジェネレータだからで、出題条件を
 * 変えたときは双方で取り直すこと。
 */
export const QUESTION_GENERATION_MAX_RETRIES = 100;

export type { FuQuestionResult as TotalFuQuestionResult } from "../../_lib/fu-question-result";
export {
  toFuQuestionResult,
  parseFuQuestionResults,
} from "../../_lib/fu-question-result";
