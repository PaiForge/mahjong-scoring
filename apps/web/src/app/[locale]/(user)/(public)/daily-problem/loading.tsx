import { DailyProblemBoardSkeleton } from "./_components/daily-problem-board-skeleton";

/**
 * 本日の問題の読み込み中スケルトン
 *
 * 動的ページ（cookie を読む）なので、遷移の待ちにこれを出す。本体と同じ枠・
 * スクロール位置に置く（{@link DailyProblemBoardSkeleton}）。
 */
export default function Loading() {
  return <DailyProblemBoardSkeleton />;
}
