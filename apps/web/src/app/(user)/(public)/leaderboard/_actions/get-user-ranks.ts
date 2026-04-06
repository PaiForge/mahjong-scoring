'use server';

import { unstable_cache } from 'next/cache';

import { createClient } from '@/lib/supabase/server';

import { getQueriesForPeriod } from '../_lib/period-queries';
import type { LeaderboardPeriod, UserRankInfo } from '../_lib/types';
import { MODULES } from '../_lib/types';

const REVALIDATE_SECONDS = 300; // 5 minutes
const LEADERBOARD_KEY = 'default';

/**
 * 認証済みユーザーの全モジュールにおけるランクを一括取得する。
 * 未認証の場合は空配列を返す。
 * ユーザーランク一括取得
 *
 * @param period - 期間
 */
export async function getUserRanks(
  period: LeaderboardPeriod,
): Promise<readonly UserRankInfo[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const userId = user.id;

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
