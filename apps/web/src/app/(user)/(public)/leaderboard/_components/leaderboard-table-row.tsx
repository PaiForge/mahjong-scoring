import { memo } from "react";

import type { RankedLeaderboardRow } from "@/lib/db/leaderboard-queries";
import { LeaderboardRowCells } from "./leaderboard-row-cells";

interface LeaderboardTableRowProps {
  readonly row: RankedLeaderboardRow;
  readonly isCurrentUser: boolean;
}

/**
 * リーダーボードテーブル行
 * ランキングテーブルの1行
 */
export const LeaderboardTableRow = memo(function LeaderboardTableRowComponent({
  row,
  isCurrentUser,
}: LeaderboardTableRowProps) {
  return (
    <tr
      className={`border-b-2 border-dashed border-border/40 last:border-b-0 transition-colors ${
        isCurrentUser ? "bg-primary-50" : "hover:bg-surface-50"
      }`}
    >
      <LeaderboardRowCells row={row} />
    </tr>
  );
});
