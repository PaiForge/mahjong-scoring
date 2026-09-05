import { MANGAN_MIN_HAN } from "@mahjong-scoring/core";
import type { QuestionGeneratorOptions } from "@mahjong-scoring/core";
import {
  PRACTICE_SLUG,
  resultStorageKeyFor,
} from "@/lib/db/practice-menu-types";

export type { ScoreQuestionResult as ManganExamQuestionResult } from "@/app/(user)/(public)/practice/_lib/score-question-result";
export { parseQuestionResults } from "@/app/(user)/(public)/practice/_lib/score-question-result";
export { paymentToScoreTableAnswer } from "@/app/(user)/(public)/practice/_lib/payment-adapter";

/** sessionStorage に保存する際のキー */
export const RESULT_STORAGE_KEY = resultStorageKeyFor(PRACTICE_SLUG.manganExam);

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
 * 同一条件になる。ダブル役満・複合役満の設定は5翻以上の点数に影響するため、
 * `excludeYakumanRuleBoundary` で採否によって正解が割れる手（四暗刻単騎・
 * 複合役満等）ごと出題から外す。この独立性は
 * `__tests__/exam-options.test.ts` が守る。
 *
 * @remarks 合格ラインを調整するときの前提
 *
 * この条件で生成される問題の区分の内訳（実測）:
 * 満貫 48% / 跳満 33% / 倍満 12% / 三倍満 1% / 役満（数え含む）6%。
 * 役満の 6% は「役一覧なしで 13 翻を数える」問題で、事実上の高難度枠。
 *
 * 合格ライン（`RANK_REGISTRY` の `minScore`）と制限時間
 * （`PRACTICE_MENU_REGISTRY` の `timeLimit`）を動かすときは、平均難易度が
 * この内訳で決まっていることを踏まえること。出題条件を変えれば内訳ごと
 * 変わるため、そちらを触ったら数値も取り直す。
 */
export const EXAM_GENERATE_OPTIONS = {
  allowedRanges: ["manganPlus"],
  minHan: MANGAN_MIN_HAN,
  excludeYakumanRuleBoundary: true,
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
