import { getTranslations } from 'next-intl/server';

import type { LeaderboardModule, LeaderboardPeriod, LeaderboardResult } from '../_lib/types';
import { PAGE_SIZE } from '../_lib/types';
import { LeaderboardPagination } from './leaderboard-pagination';
import { LeaderboardTable } from './leaderboard-table';
import { PeriodSelector } from './period-selector';

interface LeaderboardDetailContentProps {
  readonly module: LeaderboardModule;
  readonly currentUserId: string | undefined;
  readonly data: LeaderboardResult;
  readonly currentPage: number;
  readonly period: LeaderboardPeriod;
}

/**
 * リーダーボード詳細コンテンツ
 * 期間切り替え・ページネーション付きランキング表示
 */
export async function LeaderboardDetailContent({
  module: mod,
  currentUserId,
  data,
  currentPage,
  period,
}: LeaderboardDetailContentProps) {
  const t = await getTranslations('leaderboard');

  const totalPages = Math.ceil(data.totalCount / PAGE_SIZE);
  const periodLabel = t(`period.${period}`);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-surface-500">{periodLabel}</p>
        <PeriodSelector currentPeriod={period} module={mod} />
      </div>

      <div>
        <LeaderboardTable
          rows={data.rows}
          currentUserId={currentUserId}
          currentUserRank={data.currentUserRank}
        />
        <LeaderboardPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalCount={data.totalCount}
        />
      </div>
    </div>
  );
}
