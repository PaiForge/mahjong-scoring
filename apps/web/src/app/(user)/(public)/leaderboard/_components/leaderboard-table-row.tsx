import { memo } from 'react';

import type { LeaderboardRow } from '../_lib/types';
import { LeaderboardRowCells } from './leaderboard-row-cells';

interface LeaderboardTableRowProps {
  readonly row: LeaderboardRow;
  readonly isCurrentUser: boolean;
}

/**
 * リーダーボードテーブル行
 * ランキングテーブルの1行
 */
export const LeaderboardTableRow = memo(function LeaderboardTableRow({ row, isCurrentUser }: LeaderboardTableRowProps) {
  return (
    <tr
      className={`border-b border-surface-200 last:border-b-0 transition-colors ${
        isCurrentUser ? 'bg-primary-50' : 'hover:bg-surface-50'
      }`}
    >
      <LeaderboardRowCells row={row} />
    </tr>
  );
});
