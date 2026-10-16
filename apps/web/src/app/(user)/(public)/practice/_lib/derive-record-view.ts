import { ranksBetter } from "@/lib/db/ranking-order";
import type { ScoreComparison } from "@/lib/db/score-comparison-queries";
import type {
  RecordStatus,
  RecordView,
} from "@mahjong-scoring/features/challenge/record-view";

/**
 * 比較サマリを記録セクションの表示値に射影する
 * 記録ビュー導出
 *
 * クエリからもコンポーネントからも切り離してあるため、バッジの判定規則を
 * DB も JSX も用意せずにテストできる。web の結果ページと、アプリ向けの確定の
 * API（`handleFinishChallenge`）が同じ判定を使う。
 *
 * 取得できた比較サマリだけを受け取る。取得に失敗した場合は呼び出し側
 * （`RecordSection`）が行そのものを断りに差し替えるため、ここへは来ない。
 * 失敗を undefined として渡せるようにすると、「まだ記録が無い」と
 * 「訊けなかった」がどちらも同じ「—」の並びになって区別できなくなる。
 *
 * @param comparison - 比較サマリ
 */
export function deriveRecordView(comparison: ScoreComparison): RecordView {
  const { current, previousBest, previousLast } = comparison;

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
