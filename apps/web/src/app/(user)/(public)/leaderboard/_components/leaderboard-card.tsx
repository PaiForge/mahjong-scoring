'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';

import { menuTypeToMessageKey } from '@/lib/db/practice-menu-types';

import type { LeaderboardModule, LeaderboardPeriod } from '../_lib/types';
import { buildDetailPath } from '../_lib/types';

interface LeaderboardCardProps {
  readonly module: LeaderboardModule;
  readonly period: LeaderboardPeriod;
  readonly rank: number | undefined;
}

/**
 * リーダーボードカード
 * 一覧ページで各モジュールのランキング概要を表示するカード
 */
export function LeaderboardCard({ module, period, rank }: LeaderboardCardProps) {
  const t = useTranslations('leaderboard');

  const msgKey = menuTypeToMessageKey(module);
  const title = t(`module.${msgKey}`);
  const detailPath = buildDetailPath(period, module);

  return (
    <Link
      href={detailPath}
      className="group block rounded-lg border border-surface-200 bg-white p-4 shadow-sm transition-all hover:shadow-md hover:border-surface-300"
    >
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-surface-100 text-lg">
          {t(`moduleIcon.${msgKey}`)}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-medium text-surface-700">{title}</h3>
          {rank !== undefined ? (
            <p className="text-lg font-semibold text-primary-600 tabular-nums">
              {t('rankLabel', { rank })}
            </p>
          ) : (
            <p className="text-sm text-surface-400">{t('notRanked')}</p>
          )}
        </div>
      </div>
    </Link>
  );
}
