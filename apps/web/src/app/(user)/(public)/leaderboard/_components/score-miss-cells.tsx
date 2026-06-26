import type { LeaderboardRow } from "../_lib/types";
import { getMissColorClass } from "../_lib/miss-color";

interface ScoreMissCellsProps {
  readonly row: LeaderboardRow;
}

/**
 * スコア列とミス数列のセル（共通）
 * スコア・ミスセル
 *
 * 通常のランキング行（LeaderboardRowCells）と現在ユーザー行
 * （CurrentUserRankRow）で共有する。
 */
export function ScoreMissCells({ row }: ScoreMissCellsProps) {
  return (
    <>
      <td className="py-3 px-3 text-right tabular-nums font-semibold text-surface-700 w-20">
        {row.score}
      </td>
      <td
        className={`py-3 px-3 text-right tabular-nums w-24 ${getMissColorClass(row.incorrectAnswers)}`}
      >
        {row.incorrectAnswers}
      </td>
    </>
  );
}
