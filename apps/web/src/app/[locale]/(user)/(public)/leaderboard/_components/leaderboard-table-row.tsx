import { memo } from "react";

import type { RankedLeaderboardRow } from "@/lib/db/leaderboard-queries";
import { leaderboardRowClassName } from "../_lib/podium";
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
    <tr className={leaderboardRowClassName({ rank: row.rank, isCurrentUser })}>
      <LeaderboardRowCells row={row} />
    </tr>
  );
});
