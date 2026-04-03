import {
  getAllTimeRanking,
  getMonthlyRanking,
  getUserAllTimeRankedRow,
  getUserMonthlyRankedRow,
} from '@/lib/db/challenge-queries';
import type { LeaderboardPage, RankedLeaderboardRow } from '@/lib/db/challenge-queries';

import type { LeaderboardPeriod } from './types';

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

const PERIOD_QUERIES: Record<LeaderboardPeriod, PeriodQueries> = {
  'all-time': {
    getRanking: getAllTimeRanking,
    getUserRankedRow: getUserAllTimeRankedRow,
  },
  monthly: {
    getRanking: getMonthlyRanking,
    getUserRankedRow: getUserMonthlyRankedRow,
  },
};

/**
 * 期間に応じたクエリ関数群を返す
 * 期間別クエリ取得
 */
export function getQueriesForPeriod(period: LeaderboardPeriod): PeriodQueries {
  return PERIOD_QUERIES[period];
}
