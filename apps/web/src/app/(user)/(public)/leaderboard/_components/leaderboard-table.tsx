import { getTranslations } from 'next-intl/server';

import type { LeaderboardRow } from '../_lib/types';
import { CurrentUserRankRow } from './current-user-rank-row';
import { LeaderboardTableHeader } from './leaderboard-table-header';
import { LeaderboardTableRow } from './leaderboard-table-row';

interface LeaderboardTableProps {
  readonly rows: readonly LeaderboardRow[];
  readonly currentUserId: string | undefined;
  readonly currentUserRank: LeaderboardRow | undefined;
}

/**
 * リーダーボードテーブル
 * ランキング表示のメインテーブル
 */
export async function LeaderboardTable({ rows, currentUserId, currentUserRank }: LeaderboardTableProps) {
  const t = await getTranslations('leaderboard');

  if (rows.length === 0) {
    return (
      <div className="text-center py-12 text-surface-400">
        <p className="text-lg">{t('emptyState')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      <div>
        <table className="w-full table-fixed" aria-label={t('title')}>
          <LeaderboardTableHeader />
          <tbody>
            {rows.map((row) => (
              <LeaderboardTableRow
                key={row.userId}
                row={row}
                isCurrentUser={row.userId === currentUserId}
              />
            ))}
          </tbody>
        </table>
      </div>

      {currentUserRank ? <CurrentUserRankRow row={currentUserRank} /> : undefined}
    </div>
  );
}
