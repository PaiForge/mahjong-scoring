import type { ScoreTableAnswer } from "@mahjong-scoring/core";

import type { ScoreTableFocus } from "../score-table/focus";

/**
 * トレーニングで開示する正解の点数（`RevealedScoreAnswer`）の props（web とアプリで共有）
 * 正解開示表示props
 *
 * 点数を答える練習（点数表早引き・点数計算）は選択肢を持たないため、回答の
 * フィードバックだけでは正解値が分からない。「わからない」と不正解のあとに
 * 出題文の行と差し替えて出す。
 */
export interface RevealedScoreAnswerProps {
  /** 開示する正解の点数 */
  readonly answer: ScoreTableAnswer;
  /** `revealedAnswer` / `pointSuffix` / `all` キーを持つ翻訳名前空間 */
  readonly translationNamespace: string;
  /**
   * 正解を押したときに開く点数表の位置（親子・ロンツモ・翻・符）
   *
   * 渡すと正解の点数が押せる文字になり、そのセルをハイライトした点数早見表を
   * モーダルで開く（`score-table/focus.ts` の `scoreTableFocusOf` で組む）。
   * 渡さなければただの文字。
   */
  readonly scoreTableFocus?: ScoreTableFocus;
}
