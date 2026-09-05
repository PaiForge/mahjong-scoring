import type { QuestionGeneratorOptions } from "@mahjong-scoring/core";
import {
  PRACTICE_SLUG,
  resultStorageKeyFor,
} from "@/lib/db/practice-menu-types";

export type { ScoreQuestionResult as ScoreExamQuestionResult } from "@/app/(user)/(public)/practice/_lib/score-question-result";
export { parseQuestionResults } from "@/app/(user)/(public)/practice/_lib/score-question-result";
export { paymentToScoreTableAnswer } from "@/app/(user)/(public)/practice/_lib/payment-adapter";

/** sessionStorage に保存する際のキー */
export const RESULT_STORAGE_KEY = resultStorageKeyFor(PRACTICE_SLUG.scoreExam);

/**
 * 昇段試験（あらゆる手の点数計算）の出題条件
 * 試験出題条件
 *
 * 下の級の試験と違い、出題範囲を絞る条件を1つも持たない。符でも点数帯でも
 * 役でもなく「どんな手でも点数が出せる」ことが合格基準だから、絞りを入れた
 * 時点で測るものが変わる。七対子（`includeChiitoi`）は既定が false のため
 * ここだけ明示的に開ける — 平和・面子手・副露手は既定で出る。
 *
 * 残る3つは範囲の絞り込みではなく、答えが1つに定まらない手を落とすための
 * 条件:
 *
 * - `excludeRenfonpai: true` — 場風＝自風の局面を出さない。連風牌の雀頭を
 *   2符とするか4符とするかがローカルルールで割れており、その1点で符が、
 *   ひいては点数が変わる（4級・1級の試験が同じ理由で同じ条件を持つ）
 * - `excludeKiriageBoundary: true` — 30符4翻・60符3翻を出さない。標準ルール
 *   なら満貫未満、切り上げ満貫ルールなら満貫と、正解そのものが割れる。
 *   点数帯を絞る下の級では選択肢が満貫未満／以上のどちらかに固定されていて
 *   切り上げた側を選べないため露出しなかったが、選択肢を全点数に開く
 *   この試験では受験者の設定次第で正解が変わってしまう
 * - `excludeYakumanRuleBoundary: true` — 役満ルール（ダブル役満の形・
 *   複合役満の合算）の採否で正解が割れる手（四暗刻単騎・複合役満等）を
 *   出さない
 *
 * ルール設定（連風牌4符・切り上げ満貫・ダブル役満）そのものは意図的に
 * 含めない。上の3つで割れる局面ごと出題から外してあるため、端末ローカル設定に
 * 関係なく全受験者が同一条件になる。この独立性は
 * `__tests__/exam-options.test.ts` が守る。
 *
 * @remarks 合格ラインを調整するときの前提
 *
 * この条件で生成される問題の内訳（30,000 回の生成で実測、2026-09 時点）:
 * 符は 20符 2% / 25符 12% / 30符 37% / 40符 30% / 50符 10% / 60符以上 8%、
 * 翻数は 1翻 38% / 2翻 27% / 3翻 16% / 4翻 7% / 5翻以上 11%。点数区分は
 * 満貫未満 82% / 満貫 12% / 跳満 4% / 倍満以上 2%。ツモが 60%、副露が 39%、
 * 立直が 11%、親が 25%、七対子が 12% 混ざる。
 * 1回の試行あたりの成立率は 42% で、`generateValidScoreQuestion` の既定予算
 * （100 回）なら生成失敗は事実上起きないため、予算の上書きは持たない。
 *
 * 合格ライン（`RANK_REGISTRY` の `minScore`）と制限時間
 * （`PRACTICE_MENU_REGISTRY` の `timeLimit`）はこの内訳を前提にした値。
 * 出題条件を変えたら数値も取り直すこと。
 */
export const EXAM_GENERATE_OPTIONS = {
  includeChiitoi: true,
  excludeRenfonpai: true,
  excludeKiriageBoundary: true,
  excludeYakumanRuleBoundary: true,
} as const satisfies QuestionGeneratorOptions;
