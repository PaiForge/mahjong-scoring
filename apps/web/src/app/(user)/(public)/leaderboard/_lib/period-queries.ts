import {
  getAllTimeRanking,
  getMonthlyRanking,
} from "@/lib/db/leaderboard-queries";
import type {
  LeaderboardPage,
  RankedLeaderboardRow,
} from "@/lib/db/leaderboard-queries";
import {
  getUserAllTimeRankedRow,
  getUserMonthlyRankedRow,
} from "@/lib/db/user-rank-queries";

import type { LeaderboardPeriod } from "./types";

type RankingFn = (
  menuType: string,
  leaderboardKey: string,
  offset: number,
  limit: number,
) => Promise<LeaderboardPage>;

type UserRankedRowFn = (
  userId: string,
  menuType: string,
  leaderboardKey: string,
) => Promise<RankedLeaderboardRow | undefined>;

interface PeriodQueries {
  readonly getRanking: RankingFn;
  readonly getUserRankedRow: UserRankedRowFn;
}

/**
 * 期間に応じたクエリ関数群を返す
 * 期間別クエリ取得
 *
 * 月間の集計境界は `now` から導く。ここで `now` を束縛してしまうことで、
 * 一覧取得と自分の順位取得が必ず同じ「今」を見る（片方だけが月替わりを
 * またいで別の月を集計する余地を、呼び出し側の規律ではなく型で閉じる）。
 * 全期間は境界を持たないため `now` を使わない。
 *
 * @param period - 集計期間
 * @param now - 「今」として扱う時刻。呼び出し側で1回だけ生成して渡す
 */
export function getQueriesForPeriod(
  period: LeaderboardPeriod,
  now: Date,
): PeriodQueries {
  switch (period) {
    case "all-time":
      return {
        getRanking: getAllTimeRanking,
        getUserRankedRow: getUserAllTimeRankedRow,
      };
    case "monthly":
      return {
        getRanking: (menuType, leaderboardKey, offset, limit) =>
          getMonthlyRanking(menuType, leaderboardKey, offset, limit, now),
        getUserRankedRow: (userId, menuType, leaderboardKey) =>
          getUserMonthlyRankedRow(userId, menuType, leaderboardKey, now),
      };
  }
}
