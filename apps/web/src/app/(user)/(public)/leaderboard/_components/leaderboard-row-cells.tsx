import type { LeaderboardRow } from '../_lib/types';
import { PlayerCell } from './player-cell';
import { RankBadge } from './rank-badge';

interface LeaderboardRowCellsProps {
  readonly row: LeaderboardRow;
}

function getMissColorClass(incorrectAnswers: number): string {
  if (incorrectAnswers === 0) return 'text-primary-600';
  if (incorrectAnswers <= 1) return 'text-surface-500';
  return 'text-red-500';
}

/**
 * リーダーボード行セル
 * ランキングテーブルの1行分のセル群
 */
export function LeaderboardRowCells({ row }: LeaderboardRowCellsProps) {
  return (
    <>
      <td className="py-3 px-3 text-center w-16">
        <RankBadge rank={row.rank} />
      </td>
      <td className="py-3 px-3">
        <PlayerCell row={row} />
      </td>
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
