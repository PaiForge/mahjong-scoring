import type { QuestionGeneratorOptions } from "@mahjong-scoring/core";
import {
  PRACTICE_SLUG,
  resultStorageKeyFor,
} from "@/lib/db/practice-menu-types";

export type { ScoreQuestionResult as FuScoreExamQuestionResult } from "@/app/(user)/(public)/practice/_lib/score-question-result";
export { parseQuestionResults } from "@/app/(user)/(public)/practice/_lib/score-question-result";
export { paymentToScoreTableAnswer } from "@/app/(user)/(public)/practice/_lib/payment-adapter";

/** sessionStorage に保存する際のキー */
export const RESULT_STORAGE_KEY = resultStorageKeyFor(
  PRACTICE_SLUG.fuScoreExam,
);

/**
 * 出題する符（面子手で最も多く現れる 30 / 40 / 50符）
 * 出題する符
 *
 * 教本の「平和以外の門前面子手の点数計算」「鳴いた手の点数計算」が扱う帯。
 * 下（平和の20符・七対子の25符）は符が役で固定されるため 2級・3級 の試験が
 * 受け持ち、上（60符以上）は暗刻と么九牌が重なった手に偏って出題が細るため
 * 外している。
 */
const EXAM_FU = [30, 40, 50];

/**
 * 昇級試験（30〜50符の点数計算）の出題条件
 * 試験出題条件
 *
 * これまでの試験と違い、符を役で固定しない — 符を手牌から積み上げること
 * 自体が試験の主題だから。`allowedFu` は符を教えるためではなく、出題の帯を
 * 30〜50符に切るために渡す。`allowedRanges: ["nonMangan"]` で満貫未満に
 * 限るのは、満貫以上になると符が点数に効かなくなり試験の主題が消えるため
 * （満貫以上は5級の試験が受け持つ）。
 *
 * 副露した手も出す（`includeFuro` は既定の true のまま）。この級の前提章は
 * 門前の面子手と鳴いた手の2章で、鳴いた手のロンが門前より10符低いことも
 * 出題範囲に入る。生成される手の約半分が副露手になる。
 *
 * `excludeRenfonpai: true` で場風＝自風の局面を出題しない。連風牌の雀頭を
 * 2符とするか4符とするかはローカルルールで割れており、その1点で符が、
 * ひいては点数が変わるため（4級の試験が同じ理由で同じ条件を持つ）。
 *
 * 意図的にルール設定（連風牌4符・切り上げ満貫）そのものは含めない。連風牌は
 * 上記の通り局面ごと出題から外してあり、切り上げ満貫は 30符4翻・60符3翻に
 * 効くが、出題は標準ルールで採点し（教本の点数表と同じ）、回答の選択肢も
 * 満貫未満に固定しているので切り上げ後の点数はそもそも選べない。どちらも
 * 端末ローカル設定に関係なく全受験者が同一条件になる。この独立性は
 * `__tests__/exam-options.test.ts` が守る。
 *
 * @remarks 合格ラインを調整するときの前提
 *
 * この条件で生成される問題の内訳（30,000 回の生成で実測、2026-08 時点）:
 * 符は 30符 56% / 40符 35% / 50符 9%、翻数は 1翻 53% / 2翻 29% / 3翻 15% /
 * 4翻 3%。ツモが 60%、副露が 52%、立直が 8%、親が 25% 混ざる。
 * 1回の試行あたりの成立率は 32% で、`generateValidScoreQuestion` の既定予算
 * （100 回）なら生成失敗は事実上起きないため、予算の上書きは持たない。
 *
 * 合格ライン（`RANK_REGISTRY` の `minScore`）と制限時間
 * （`PRACTICE_MENU_REGISTRY` の `timeLimit`）はこの内訳を前提にした値。
 * 出題条件を変えたら数値も取り直すこと。
 */
export const EXAM_GENERATE_OPTIONS = {
  allowedRanges: ["nonMangan"],
  allowedFu: EXAM_FU,
  excludeRenfonpai: true,
} as const satisfies QuestionGeneratorOptions;
