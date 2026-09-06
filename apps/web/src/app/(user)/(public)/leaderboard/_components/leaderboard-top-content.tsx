import { LinkRowList } from "@/app/(user)/_components/link-row";
import { getOptionalUser } from "@/lib/auth";
import { isHiddenFromLeaderboard } from "@/lib/db/leaderboard-visibility";

import { getUserRanks } from "../_actions/get-user-ranks";
import type { LeaderboardPeriod, UserRankInfo } from "../_lib/types";
import { BOARDS, boardKey } from "../_lib/types";
import { LeaderboardModuleRow } from "./leaderboard-module-row";
import { ViewerHiddenNote } from "./viewer-hidden-note";

interface LeaderboardTopContentProps {
  readonly period: LeaderboardPeriod;
}

/**
 * リーダーボード一覧コンテンツ
 * 全土俵（練習 × バリアント）のランキングを行リンクで並べる
 */
export async function LeaderboardTopContent({
  period,
}: LeaderboardTopContentProps) {
  const user = await getOptionalUser();
  const currentUserId = user?.id ?? undefined;

  const viewerHidden =
    currentUserId === undefined
      ? false
      : await isHiddenFromLeaderboard(currentUserId);

  let userRanks: readonly UserRankInfo[] = [];
  // 非表示中はどのモジュールでも順位が付かない。モジュール数ぶんの
  // ROW_NUMBER クエリを空振りさせないよう手前で打ち切る。
  if (currentUserId && !viewerHidden) {
    userRanks = await getUserRanks(period);
  }

  const rankMap = new Map<string, number>(
    userRanks.map((r) => [boardKey(r), r.rank]),
  );

  return (
    <div className="space-y-4">
      {viewerHidden ? <ViewerHiddenNote /> : undefined}

      <LinkRowList>
        {BOARDS.map((board) => (
          <LeaderboardModuleRow
            key={boardKey(board)}
            board={board}
            period={period}
            rank={currentUserId ? rankMap.get(boardKey(board)) : undefined}
          />
        ))}
      </LinkRowList>
    </div>
  );
}
