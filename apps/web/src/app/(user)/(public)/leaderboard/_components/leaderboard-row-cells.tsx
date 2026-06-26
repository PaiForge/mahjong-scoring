import type { LeaderboardRow } from "../_lib/types";
import { PlayerCell } from "./player-cell";
import { RankBadge } from "./rank-badge";
import { ScoreMissCells } from "./score-miss-cells";

interface LeaderboardRowCellsProps {
  readonly row: LeaderboardRow;
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
      <ScoreMissCells row={row} />
    </>
  );
}
