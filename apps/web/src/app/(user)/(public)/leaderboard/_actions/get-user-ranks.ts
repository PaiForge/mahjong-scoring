'use server';

import { unstable_cache } from 'next/cache';

import { getQueriesForPeriod } from '../_lib/period-queries';
import type { LeaderboardPeriod, UserRankInfo } from '../_lib/types';
import { MODULES } from '../_lib/types';

const REVALIDATE_SECONDS = 300; // 5 minutes
const LEADERBOARD_KEY = 'default';

/**
 * 全モジュールにおけるユーザーのランクを一括取得する
 * ユーザーランク一括取得
 *
 * @param userId - ユーザーID
 * @param period - 期間
 */
export async function getUserRanks(
  userId: string,
  period: LeaderboardPeriod,
): Promise<readonly UserRankInfo[]> {
  return unstable_cache(
    async () => {
      const { getUserRankedRow } = getQueriesForPeriod(period);

      const results = await Promise.allSettled(
        MODULES.map(async (module) => {
          const result = await getUserRankedRow(userId, module, LEADERBOARD_KEY);
          if (!result) return undefined;
          return { module, rank: result.rank } satisfies UserRankInfo;
        }),
      );

      return results
        .filter(
          (r): r is PromiseFulfilledResult<UserRankInfo | undefined> => r.status === 'fulfilled',
        )
        .map((r) => r.value)
        .filter((r): r is UserRankInfo => r !== undefined);
    },
    ['user-ranks', userId, period],
    { revalidate: REVALIDATE_SECONDS, tags: ['leaderboard'] },
  )();
}
