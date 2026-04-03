'use client';

import { useCallback, useState, useTransition } from 'react';

import { useTranslations } from 'next-intl';

import { getLeaderboard } from '../_actions/get-leaderboard';
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
  readonly initialPeriod: LeaderboardPeriod;
}

/**
 * リーダーボード詳細コンテンツ
 * 期間切り替え・ページネーション付きランキング表示
 */
export function LeaderboardDetailContent({
  module,
  currentUserId,
  data: initialData,
  currentPage: initialPage,
  initialPeriod,
}: LeaderboardDetailContentProps) {
  const t = useTranslations('leaderboard');
  const [isPending, startTransition] = useTransition();
  const [page, setPage] = useState(initialPage);
  const [period, setPeriod] = useState<LeaderboardPeriod>(initialPeriod);
  const [data, setData] = useState<LeaderboardResult>(initialData);

  const totalPages = Math.ceil(data.totalCount / PAGE_SIZE);

  const fetchData = useCallback(
    (newPeriod: LeaderboardPeriod, newPage: number) => {
      startTransition(async () => {
        const result = await getLeaderboard(module, newPeriod, newPage);
        setData(result);
      });
    },
    [module],
  );

  const handlePeriodChange = useCallback(
    (newPeriod: LeaderboardPeriod) => {
      setPeriod(newPeriod);
      setPage(1);
      fetchData(newPeriod, 1);
    },
    [fetchData],
  );

  const handlePageChange = useCallback(
    (newPage: number) => {
      setPage(newPage);
      fetchData(period, newPage);
    },
    [fetchData, period],
  );

  const periodLabel = t(`period.${period}`);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-surface-500">{periodLabel}</p>
        <PeriodSelector currentPeriod={period} onPeriodChange={handlePeriodChange} />
      </div>

      <div
        className={`transition-opacity ${isPending ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}
      >
        <LeaderboardTable
          rows={data.rows}
          currentUserId={currentUserId}
          currentUserRank={data.currentUserRank}
        />
        <LeaderboardPagination
          currentPage={page}
          totalPages={totalPages}
          totalCount={data.totalCount}
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  );
}
