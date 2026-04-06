'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';

import { ToggleGroup } from '@/app/_components/toggle-group';

import type { LeaderboardPeriod } from '../_lib/types';
import { VALID_PERIODS } from '../_lib/types';

interface PeriodSelectorProps {
  readonly currentPeriod: LeaderboardPeriod;
  readonly onPeriodChange: (period: LeaderboardPeriod) => void;
}

/**
 * 期間セレクター
 * リーダーボードの期間切り替えコンポーネント
 */
export function PeriodSelector({ currentPeriod, onPeriodChange }: PeriodSelectorProps) {
  const t = useTranslations('leaderboard');

  const options = useMemo(
    () => VALID_PERIODS.map((p) => ({
      value: p,
      label: t(`period.${p}`),
    })),
    [t],
  );

  return <ToggleGroup options={options} selected={currentPeriod} onChange={onPeriodChange} />;
}
