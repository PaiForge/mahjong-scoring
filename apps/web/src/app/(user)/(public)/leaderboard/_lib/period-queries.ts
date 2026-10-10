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
import { jstCalendarDate } from "@mahjong-scoring/features/jst";

import type { LeaderboardPeriod } from "@mahjong-scoring/features/leaderboard/boards";

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
  /**
   * 集計の範囲を表すキャッシュキーの一片
   *
   * 月間は JST の年月まで含める（`monthly:2026-10`）。期間名だけをキーに
   * すると、月が替わっても revalidate までは前月の集計が返る。
   */
  readonly cacheKey: string;
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
 * キャッシュキー（`cacheKey`）も同じ `now` から導く。キャッシュする側が
 * 集計の範囲をキーに入れ損なう余地を、クエリと同じ場所で閉じる。
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
        cacheKey: "all-time",
      };
    case "monthly":
      return {
        getRanking: (menuType, leaderboardKey, offset, limit) =>
          getMonthlyRanking(menuType, leaderboardKey, offset, limit, now),
        getUserRankedRow: (userId, menuType, leaderboardKey) =>
          getUserMonthlyRankedRow(userId, menuType, leaderboardKey, now),
        cacheKey: monthlyCacheKey(now),
      };
  }
}

/** JST の年月のキー（`monthly:2026-10`） */
function monthlyCacheKey(now: Date): string {
  const { year, month } = jstCalendarDate(now);
  return `monthly:${year}-${String(month).padStart(2, "0")}`;
}
