'use server';

import { unstable_cache } from 'next/cache';

import { getQueriesForPeriod } from '../_lib/period-queries';
import type { LeaderboardModule, LeaderboardPeriod, LeaderboardResult, LeaderboardRow } from '../_lib/types';
import { PAGE_SIZE } from '../_lib/types';
import { isValidModule, isValidPeriod } from '../_lib/validators';

// ---------------------------------------------------------------------------
// Cached ranking data (shared across all users)
// ---------------------------------------------------------------------------

const REVALIDATE_SECONDS = 300; // 5 minutes
const LEADERBOARD_KEY = 'default';

function getCachedRanking(
  module: LeaderboardModule,
  period: LeaderboardPeriod,
  offset: number,
  limit: number,
) {
  return unstable_cache(
    async () => {
      const { getRanking } = getQueriesForPeriod(period);
      return getRanking(module, LEADERBOARD_KEY, offset, limit);
    },
    ['leaderboard-ranking', module, LEADERBOARD_KEY, period, String(offset), String(limit)],
    { revalidate: REVALIDATE_SECONDS, tags: ['leaderboard'] },
  )();
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

const EMPTY_RESULT: LeaderboardResult = { rows: [], totalCount: 0, currentUserRank: undefined };

/**
 * リーダーボードデータを取得する
 * リーダーボード取得
 *
 * @param module - ドリル種別
 * @param period - 期間（all-time / monthly）
 * @param page - ページ番号（1始まり）
 * @param currentUserId - 現在のユーザーID（任意）
 */
export async function getLeaderboard(
  module: LeaderboardModule,
  period: LeaderboardPeriod,
  page: number,
  currentUserId?: string,
): Promise<LeaderboardResult> {
  if (!isValidModule(module) || !isValidPeriod(period) || page < 1) {
    return EMPTY_RESULT;
  }

  const offset = (page - 1) * PAGE_SIZE;

  try {
    const { rows, total } = await getCachedRanking(module, period, offset, PAGE_SIZE);

    const leaderboardRows: LeaderboardRow[] = rows.map((r, i) => ({
      ...r,
      rank: offset + i + 1,
    }));

    let currentUserRank: LeaderboardRow | undefined;
    if (currentUserId && !leaderboardRows.some((r) => r.userId === currentUserId)) {
      const { getUserRankedRow } = getQueriesForPeriod(period);
      currentUserRank = await getUserRankedRow(currentUserId, module, LEADERBOARD_KEY);
    }

    return { rows: leaderboardRows, totalCount: total, currentUserRank };
  } catch (error) {
    console.error('[getLeaderboard] DB query failed:', error);
    return EMPTY_RESULT;
  }
}
