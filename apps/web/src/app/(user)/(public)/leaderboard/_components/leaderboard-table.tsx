import { getTranslations } from "next-intl/server";

import type { RankedLeaderboardRow } from "@/lib/db/leaderboard-queries";
import { CurrentUserRankRow } from "./current-user-rank-row";
import { LeaderboardTableHeader } from "./leaderboard-table-header";
import { LeaderboardTableRow } from "./leaderboard-table-row";
import { ViewerHiddenNote } from "./viewer-hidden-note";

interface LeaderboardTableProps {
  readonly rows: readonly RankedLeaderboardRow[];
  readonly currentUserId: string | undefined;
  readonly currentUserRank: RankedLeaderboardRow | undefined;
  /** 閲覧者が自分でランキング非表示にしているか */
  readonly viewerHidden: boolean;
}

/**
 * リーダーボードテーブル
 * ランキング表示のメインテーブル
 */
export async function LeaderboardTable({
  rows,
  currentUserId,
  currentUserRank,
  viewerHidden,
}: LeaderboardTableProps) {
  const t = await getTranslations("leaderboard");

  if (rows.length === 0) {
    return (
      <div className="text-center py-12 text-surface-400">
        <p className="text-lg">{t("emptyState")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      <div>
        <table className="w-full table-fixed" aria-label={t("title")}>
          <LeaderboardTableHeader />
          <tbody>
            {rows.map((row) => (
              <LeaderboardTableRow
                key={row.userId}
                row={row}
                isCurrentUser={row.userId === currentUserId}
              />
            ))}
          </tbody>
        </table>
      </div>

      {viewerHidden ? (
        <div className="mt-2 border-t-2 border-surface-200 pt-3">
          <ViewerHiddenNote />
        </div>
      ) : undefined}
      {currentUserRank ? (
        <CurrentUserRankRow row={currentUserRank} />
      ) : undefined}
    </div>
  );
}
