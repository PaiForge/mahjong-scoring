import { getTranslations } from "next-intl/server";

import type { LeaderboardRow } from "../_lib/types";
import { PlayerCell } from "./player-cell";
import { ScoreMissCells } from "./score-miss-cells";

interface CurrentUserRankRowProps {
  readonly row: LeaderboardRow;
}

/**
 * 現在ユーザーのランク行
 * ページ外のユーザー順位を表示するセクション
 */
export async function CurrentUserRankRow({ row }: CurrentUserRankRowProps) {
  const t = await getTranslations("leaderboard");

  return (
    <div className="border-t-2 border-surface-200 mt-2">
      <div className="bg-primary-50 rounded-b-lg">
        <table className="w-full table-fixed">
          <tbody>
            <tr>
              <td className="py-3 px-3 text-center w-16">
                <span className="text-xs font-medium text-surface-400 uppercase">
                  {t("yourRank")}
                </span>
              </td>
              <td className="py-3 px-3">
                <PlayerCell row={row} />
              </td>
              <ScoreMissCells row={row} />
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
