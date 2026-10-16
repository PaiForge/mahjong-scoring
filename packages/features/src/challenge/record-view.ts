/**
 * 結果画面の記録の節が今回の走行について言えること
 * 記録ステータス
 *
 * - `first` — 今回の記録は取れたが、それ以前の記録が 1 件も無い
 * - `newBest` — ランキングと同じ順序規則（スコア → ミス → 所要時間）で
 *   これまでのベストを上回った。`challenge_best_scores` が更新される条件と
 *   同じ（web の `ranksBetter` 参照）
 * - `none` — バッジ無し。普通の走行、または今回の記録を特定できない訪問
 *   （web の `?grant=` が無い・保存に失敗した）で、過去記録だけを見せる場合
 */
export type RecordStatus = "first" | "newBest" | "none";

/**
 * 結果画面の記録の節（「今回 / 前回 / これまでのベスト」）の表示値
 * 記録ビュー
 *
 * web の結果ページ（`RecordSection`）とアプリの結果画面が同じ値を読む。
 * 判定（`deriveRecordView`）は順位規則と DB の比較を持つ web にあり、アプリは
 * 確定の応答（`MobileFinishChallengeResponse` の `comparison`）でこれを受け取る。
 */
export interface RecordView {
  readonly status: RecordStatus;
  /** 今回のスコア。今回の記録を特定できなければ undefined */
  readonly currentScore: number | undefined;
  /** 今回を除いた、これまでのベストのスコア。過去の記録が無ければ undefined */
  readonly previousBestScore: number | undefined;
  /** 前回（今回の直前）のスコア。過去の記録が無ければ undefined */
  readonly previousLastScore: number | undefined;
  /** 今回 − 前回。両方が分かるときだけ値を持つ */
  readonly diffFromLast: number | undefined;
}
