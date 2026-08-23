import { getOptionalUser } from "@/lib/auth";
import { isHiddenFromLeaderboard } from "@/lib/db/leaderboard-visibility";

import { getUserRanks } from "../_actions/get-user-ranks";
import type {
  LeaderboardModule,
  LeaderboardPeriod,
  UserRankInfo,
} from "../_lib/types";
import { MODULES } from "../_lib/types";
import { LeaderboardCard } from "./leaderboard-card";
import { ViewerHiddenNote } from "./viewer-hidden-note";

interface LeaderboardTopContentProps {
  readonly period: LeaderboardPeriod;
}

/**
 * リーダーボード一覧コンテンツ
 * 全モジュールのランキングカードを表示する
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

  const rankMap = new Map<LeaderboardModule, number>(
    userRanks.map((r) => [r.module, r.rank]),
  );

  return (
    <div className="space-y-4">
      {viewerHidden ? <ViewerHiddenNote /> : undefined}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MODULES.map((module) => (
          <LeaderboardCard
            key={module}
            module={module}
            period={period}
            rank={currentUserId ? rankMap.get(module) : undefined}
          />
        ))}
      </div>
    </div>
  );
}
