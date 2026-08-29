import type { generateTotalFuQuestion } from "@mahjong-scoring/core";
import { resultStorageKeyFor } from "@/lib/db/practice-menu-types";

export type { FuQuestionResult as FuExamQuestionResult } from "@/app/(user)/(public)/practice/_lib/fu-question-result";
export {
  toFuQuestionResult,
  parseFuQuestionResults,
} from "@/app/(user)/(public)/practice/_lib/fu-question-result";

/** sessionStorage に保存する際のキー */
export const RESULT_STORAGE_KEY = resultStorageKeyFor("fu-exam");

/**
 * 昇級試験（手牌の合計符）の出題条件
 * 試験出題条件
 *
 * `excludeRenfonpai: true` により場風＝自風の局面を出題しない。連風牌の雀頭を
 * 2符とするか4符とするかはローカルルールで割れており、その1点で合計符が
 * 変わってしまうため、連風牌が成立しない局面だけを出して答えを1つに定める。
 *
 * 意図的にルール設定ストア（`useRuleSettingsStore`）を読まない: 端末ごとの
 * 設定に関係なく全受験者が同一条件になる。この独立性は
 * `__tests__/exam-options.test.ts` が守る。もう一方の設定（切り上げ満貫）は
 * 点数の話で符には効かないため、そもそも関係しない。
 *
 * @remarks 合格ラインを調整するときの前提
 *
 * 出題プールは合計符の練習（`/practice/total-fu`）と同じで、七対子（25符固定）
 * が約12%混ざる。制限時間（`PRACTICE_MENU_REGISTRY` の `timeLimit`）と
 * 合格ライン（`RANK_REGISTRY` の `minScore`）は、1問あたり符を積み上げて
 * 切り上げる時間を見込んだ値。出題条件を変えたら数値も取り直すこと。
 */
export const EXAM_GENERATE_OPTIONS = {
  excludeRenfonpai: true,
} as const satisfies Parameters<typeof generateTotalFuQuestion>[0];

/**
 * 昇級試験の出題の生成リトライ予算
 * 試験出題リトライ予算
 *
 * 合計符の出題は1回の試行あたり約44%しか成立せず（牌の残数不足・役なしの手を
 * 弾くため）、`retryGenerate` の既定予算10では約0.3%/問で生成に失敗する。
 * 失敗した問題は盤面がプレースホルダのまま固まり、タイマーだけが進む。
 * 10問前後を解く試験では1回の受験あたり約3%がそれに当たる計算で、合否が
 * 記録に残る試験としては許容できない。100 なら失敗確率は実質ゼロで、
 * 平均試行回数は2〜3回のままなので生成コストも増えない。
 */
export const EXAM_GENERATION_MAX_RETRIES = 100;
