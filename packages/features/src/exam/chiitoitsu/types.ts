import type { QuestionGeneratorOptions } from "@mahjong-scoring/core";
import {
  PRACTICE_SLUG,
  resultStorageKeyFor,
} from "@mahjong-scoring/features/practice-menu-types";
import type { ScoreExamBoardConfig } from "../score-exam-board-config";

export type { ScoreQuestionResult as ChiitoitsuExamQuestionResult } from "@mahjong-scoring/features/results/score-question-result";
export { parseQuestionResults } from "@mahjong-scoring/features/results/score-question-result";
export { paymentToScoreTableAnswer } from "@mahjong-scoring/features/results/payment-adapter";

/** sessionStorage に保存する際のキー */
export const RESULT_STORAGE_KEY = resultStorageKeyFor(
  PRACTICE_SLUG.chiitoitsuExam,
);

/**
 * 昇級試験（七対子の点数計算）の出題条件
 * 試験出題条件
 *
 * `requiredYaku: ["七対子"]` は生成器の専用経路を通り、七対子の手だけを作る
 * （面子手を作って捨てる方式ではないため生成コストも増えない）。
 * `allowedRanges: ["nonMangan"]` で満貫未満に限るのは、満貫以上になると符が
 * 点数に効かなくなり「25符の点数表を引く」という試験の主題が消えるため
 * （満貫以上は5級の試験が受け持つ）。
 *
 * 意図的にルール設定（連風牌4符・切り上げ満貫）を含めない: 七対子の符は
 * 常に25符で雀頭を持たないため連風牌は無関係、切り上げ満貫が動かすのは
 * 30符4翻・60符3翻だけで25符には効かない。どちらも出題に影響しないため、
 * 端末ローカル設定に関係なく全受験者が同一条件になる。この独立性は
 * `__tests__/exam-options.test.ts` が守る。
 *
 * @remarks 合格ラインを調整するときの前提
 *
 * この条件で生成される問題の翻数の内訳（20,000 回の生成で実測、2026-08 時点）:
 * 2翻 38% / 3翻 45% / 4翻 17%。符は常に25符。ツモが 45%、立直が 14% 混ざる。
 * 1回の試行あたりの成立率は 43% で、`generateValidScoreQuestion` の既定予算
 * （100 回）なら生成失敗は事実上起きないため、予算の上書きは持たない。
 *
 * 合格ライン（`RANK_REGISTRY` の `minScore`）と制限時間
 * （`PRACTICE_MENU_REGISTRY` の `timeLimit`）はこの内訳を前提にした値。
 * 出題条件を変えたら数値も取り直すこと。
 */
export const EXAM_GENERATE_OPTIONS = {
  requiredYaku: ["七対子"],
  allowedRanges: ["nonMangan"],
} as const satisfies QuestionGeneratorOptions;

/**
 * 昇級試験（七対子の点数計算）の出題盤面の設定
 * 昇級試験盤面設定
 *
 * 本番と模試、web とモバイルで同じ出題盤面を組み立てるための値。
 */
export const EXAM_BOARD_CONFIG: ScoreExamBoardConfig = {
  translationNamespace: "chiitoitsuExamChallenge",
  generateOptions: EXAM_GENERATE_OPTIONS,
  scoreRange: "nonMangan",
};
