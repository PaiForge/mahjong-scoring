'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';

import { SectionTitle } from '@/app/_components/section-title';
import { LeaderboardTableHeader } from '@/app/(user)/(public)/leaderboard/_components/leaderboard-table-header';
import { LeaderboardTableRow } from '@/app/(user)/(public)/leaderboard/_components/leaderboard-table-row';
import type { LeaderboardRow } from '@/app/(user)/(public)/leaderboard/_lib/types';

interface LeaderboardPreviewProps {
  readonly rows: readonly LeaderboardRow[];
  readonly detailPath: string;
}

/**
 * リーダーボードプレビュー
 * 全期間ランキング上位3名の表示
 */
export function LeaderboardPreview({ rows, detailPath }: LeaderboardPreviewProps) {
  const t = useTranslations('leaderboard');

  if (rows.length === 0) {
    return undefined;
  }

  return (
    <div className="mt-12 space-y-3">
      <SectionTitle>{t('allTimeRanking')}</SectionTitle>
      <div>
        <table className="w-full table-fixed" aria-label={t('allTimeRanking')}>
          <LeaderboardTableHeader />
          <tbody>
            {rows.map((row) => (
              <LeaderboardTableRow
                key={row.userId}
                row={row}
                isCurrentUser={false}
              />
            ))}
          </tbody>
        </table>
      </div>
      <div className="text-center pt-2">
        <Link
          href={detailPath}
          className="text-primary-500 hover:underline text-sm font-medium"
        >
          {t('viewMore')}
        </Link>
      </div>
    </div>
  );
}
