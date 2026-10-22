import type {
  JudgementResult,
  ScoreQuestion,
  UserAnswer,
} from "@mahjong-scoring/core";

import type { ScorePracticeModeFlags } from "../practice/score/generator-options";

/**
 * 点数計算の答え合わせ（`ResultDisplay`）の props（web とアプリで共有）
 * 結果表示props
 *
 * 「あなたの回答」と「正解」を項目（役・翻数・符・点数）ごとに並べる。
 * `userAnswer` / `result` が無い場合は無回答の正解開示として描画する。
 * 「あなたの回答」列は落とさず各行に未回答の印を出す — 列数を変えると
 * 正解の列が中央へ動き、回答したときと開示したときで同じ値を別の場所に
 * 探すことになる。判定モード（{@link ScorePracticeModeFlags}）は省略すると
 * 「役なし・翻数と符あり・区分で答える・満貫以上は符なし」。
 */
export interface ResultDisplayProps extends Partial<ScorePracticeModeFlags> {
  readonly question: ScoreQuestion;
  /** ユーザーの回答。無回答の正解開示（「わからない」）では undefined */
  readonly userAnswer?: UserAnswer;
  /** 判定結果。無回答の正解開示（「わからない」）では undefined */
  readonly result?: JudgementResult;
  /**
   * 翻・符・点数の形を取らない回答の一言（聴牌形の点数計算の「役なし」）。
   * `userAnswer` の代わりに「あなたの回答」列の翻数の行へ ✗ 付きで出す
   * （役なしは翻数が無いという主張なので、その行に置く）。他の行は未回答
   */
  readonly answerSummary?: string;
  /**
   * 翻数と符を答えさせたか。答えさせていないときも正解の翻数・符の行は
   * 出す（点数の根拠として読ませる）が、「あなたの回答」は未回答の印にする
   */
  readonly requireHanFu?: boolean;
  /** 既に白い枠を持つ面の中に置くか（各アプリの `ResultTableFrame` の `embedded`） */
  readonly embedded?: boolean;
}
