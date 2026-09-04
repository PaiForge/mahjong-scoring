import { ranksBetter } from "@/lib/db/ranking-order";
import type { ScoreComparison } from "@/lib/db/score-comparison-queries";

/**
 * 記録セクションが今回の走行について言えること
 * 記録ステータス
 *
 * - `first` — 今回の記録は取れたが、それ以前の記録が 1 件も無い
 * - `newBest` — ランキングと同じ順序規則（スコア → ミス → 所要時間）で
 *   これまでのベストを上回った。`challenge_best_scores` が更新される条件と
 *   同じ（`ranksBetter` 参照）
 * - `none` — バッジ無し。普通の走行、または今回の記録を特定できない訪問
 *   （`?grant=` が無い・保存に失敗した）で、過去記録だけを見せる場合
 */
export type RecordStatus = "first" | "newBest" | "none";

/**
 * 記録セクションの表示値
 * 記録ビュー
 */
export interface RecordView {
  readonly status: RecordStatus;
  /** 今回のスコア。`?grant=` から今回の記録を特定できなければ undefined */
  readonly currentScore: number | undefined;
  readonly previousBestScore: number | undefined;
  readonly previousLastScore: number | undefined;
  /** 今回 − 前回。両方が分かるときだけ値を持つ */
  readonly diffFromLast: number | undefined;
}

/**
 * 比較サマリを記録セクションの表示値に射影する
 * 記録ビュー導出
 *
 * クエリからもコンポーネントからも切り離してあるため、バッジの判定規則を
 * DB も JSX も用意せずにテストできる。
 *
 * @param comparison - 比較サマリ。取得に失敗した場合は undefined で、
 *   すべての行が「—」になる（記録セクションの輪郭は変わらない）
 */
export function deriveRecordView(
  comparison: ScoreComparison | undefined,
): RecordView {
  const { current, previousBest, previousLast } = comparison ?? {};

  const status: RecordStatus = !current
    ? "none"
    : !previousBest
      ? "first"
      : ranksBetter(current, previousBest)
        ? "newBest"
        : "none";

  return {
    status,
    currentScore: current?.score,
    previousBestScore: previousBest?.score,
    previousLastScore: previousLast?.score,
    diffFromLast:
      current && previousLast ? current.score - previousLast.score : undefined,
  };
}
