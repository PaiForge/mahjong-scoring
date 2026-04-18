import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

import type { LeaderboardModule, LeaderboardPeriod } from '../_lib/types';
import { VALID_PERIODS, buildDetailPath } from '../_lib/types';

interface PeriodSelectorProps {
  readonly currentPeriod: LeaderboardPeriod;
  readonly module: LeaderboardModule;
}

/**
 * 期間セレクター
 * リーダーボードの期間切り替えコンポーネント
 */
export async function PeriodSelector({ currentPeriod, module: mod }: PeriodSelectorProps) {
  const t = await getTranslations('leaderboard');

  return (
    <div className="flex rounded-md border border-primary-200 bg-primary-50 p-0.5">
      {VALID_PERIODS.map((p) => (
        <Link
          key={p}
          href={buildDetailPath(p, mod)}
          className={`rounded-md px-2 py-1 text-xs font-medium transition-all ${
            currentPeriod === p
              ? 'bg-primary-600 text-white'
              : 'text-surface-700 hover:bg-surface-100'
          }`}
        >
          {t(`period.${p}`)}
        </Link>
      ))}
    </div>
  );
}
