import type { QuestionGeneratorOptions } from "@mahjong-scoring/core";
import {
  PRACTICE_SLUG,
  resultStorageKeyFor,
} from "@/lib/db/practice-menu-types";

export type { ScoreQuestionResult as PinfuExamQuestionResult } from "@/app/(user)/(public)/practice/_lib/score-question-result";
export { parseQuestionResults } from "@/app/(user)/(public)/practice/_lib/score-question-result";
export { paymentToScoreTableAnswer } from "@/app/(user)/(public)/practice/_lib/payment-adapter";

/** sessionStorage に保存する際のキー */
export const RESULT_STORAGE_KEY = resultStorageKeyFor(PRACTICE_SLUG.pinfuExam);

/**
 * 平和の符（ツモは副底のまま、ロンは門前加符が乗る）
 * 平和の符
 *
 * 教本の平和の章が出す表と同じ2つ。`allowedFu` に渡して、この2つ以外の符で
 * 採点される手を出題から落とす。
 */
const PINFU_TSUMO_FU = 20;
const PINFU_RON_FU = 30;

/**
 * 昇級試験（平和の点数計算）の出題条件
 * 試験出題条件
 *
 * `requiredYaku: ["平和"]` で平和の手に限り、`allowedRanges: ["nonMangan"]` で
 * 満貫未満に限る。満貫以上になると符が点数に効かなくなり「20符・30符の点数表を
 * 引く」という試験の主題が消えるため（満貫以上は5級の試験が受け持つ）。
 *
 * `allowedFu` は防波堤として渡す。役の判定と点数計算は同じ解釈（高点法）を
 * 採るため、平和が立った手の符は必ず 20/30符 になる。ライブラリ 0.5 までは
 * 両者が解釈を独立に選び、面子の取り方が複数ある手（999m 111p 222p 333p +
 * 単騎 など）で役に平和が立つのに点数は暗刻側の 50符 で出ていた（平和を
 * 名指しした出題の約 0.05%。ミス1回で終わる試験では 1回の受験あたり約 0.5%
 * が「平和なのに 20/30符 でない」問題を踏む計算）。合否が記録に残る試験
 * なので、仮に再発しても点数計算の符で落とせるようにしておく。
 *
 * 意図的にルール設定を含めない: 連風牌は平和と両立しない（役牌の雀頭では
 * 平和が成立しない）ため無関係。切り上げ満貫は 30符4翻 — つまり平和ロンの
 * 4翻 — に効くが、出題は標準ルールで採点し（教本の点数表と同じ）、回答の
 * 選択肢も満貫未満に固定しているので切り上げ後の点数はそもそも選べない。
 * どちらも端末ローカル設定に関係なく全受験者が同一条件になる。この独立性は
 * `__tests__/exam-options.test.ts` が守る。
 *
 * @remarks 合格ラインを調整するときの前提
 *
 * この条件で生成される問題の翻数の内訳（30,000 回の生成で実測、2026-08 時点）:
 * 1翻 18% / 2翻 36% / 3翻 31% / 4翻 15%。符はツモ20符・ロン30符の2通りで、
 * ツモが 47%、立直が 15% 混ざる。
 *
 * 合格ライン（`RANK_REGISTRY` の `minScore`）と制限時間
 * （`PRACTICE_MENU_REGISTRY` の `timeLimit`）はこの内訳を前提にした値。
 * 出題条件を変えたら数値も取り直すこと。
 */
export const EXAM_GENERATE_OPTIONS = {
  requiredYaku: ["平和"],
  allowedRanges: ["nonMangan"],
  allowedFu: [PINFU_TSUMO_FU, PINFU_RON_FU],
  // 平和は門前でしか成立しないため、副露した手は作るだけ無駄になる。
  // 出題される手の集合は変わらず、1回の試行あたりの成立率が 2.3% から
  // 6.5% に上がる（下の生成予算はこの 6.5% を前提にしている）
  includeFuro: false,
} as const satisfies QuestionGeneratorOptions;

/**
 * 昇級試験の出題の生成リトライ予算
 * 試験出題リトライ予算
 *
 * 平和の出題は1回の試行あたり約6.5%しか成立せず、`generateValidScoreQuestion`
 * の既定予算100では約0.12%/問で生成に失敗する。失敗した問題は盤面が
 * プレースホルダのまま固まり、タイマーだけが進む。10問前後を解く試験では
 * 1回の受験あたり約1.2%がそれに当たる計算で、合否が記録に残る試験としては
 * 許容できない。500 なら失敗確率は 3e-13 で実質ゼロ、平均試行回数は
 * 15回前後のままなので生成コストも増えない。
 */
export const EXAM_GENERATION_MAX_RETRIES = 500;
