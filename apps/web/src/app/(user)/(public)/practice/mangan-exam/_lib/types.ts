import { MANGAN_MIN_HAN } from "@mahjong-scoring/core";
import type { QuestionGeneratorOptions } from "@mahjong-scoring/core";
import { resultStorageKeyFor } from "@/lib/db/practice-menu-types";

export type { ScoreQuestionResult as ManganExamQuestionResult } from "../../_lib/score-question-result";
export { parseQuestionResults } from "../../_lib/score-question-result";
export { paymentToScoreTableAnswer } from "../../_lib/payment-adapter";

/** sessionStorage に保存する際のキー */
export const RESULT_STORAGE_KEY = resultStorageKeyFor("mangan-exam");

/**
 * 昇級試験の出題条件
 * 試験出題条件
 *
 * `minHan: MANGAN_MIN_HAN` により翻数だけで点数が確定する手（5翻以上）に
 * 限定する。`allowedRanges: ["manganPlus"]` だけでは符由来の満貫
 * （4翻40符等、プールの約37%）が混ざり、符を計算しないと点数が確定しない
 * 問題が出てしまう。試験は「符の知識を前提にしない」のが要件。
 *
 * 意図的にルール設定（連風牌4符・切り上げ満貫）を含めない: どちらも
 * 5翻以上の点数には影響しないため、端末ローカル設定に関係なく全受験者が
 * 同一条件になる。この独立性は `__tests__/exam-options.test.ts` が守る。
 */
export const EXAM_GENERATE_OPTIONS = {
  allowedRanges: ["manganPlus"],
  minHan: MANGAN_MIN_HAN,
} as const satisfies QuestionGeneratorOptions;

/**
 * 昇級試験の出題の生成リトライ予算
 * 試験出題リトライ予算
 *
 * `minHan: MANGAN_MIN_HAN` の出題は生成成功率が低く（1問あたり平均約21回の
 * 試行が必要）、既定予算の100では約0.8%/問で生成失敗し、盤面がプレースホルダの
 * ままタイマーだけが走る。500 なら失敗確率は実質ゼロで、生成コストも数ms/問。
 */
export const EXAM_GENERATION_MAX_RETRIES = 500;
