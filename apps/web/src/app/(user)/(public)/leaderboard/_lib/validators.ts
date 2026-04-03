import { isPracticeMenuType } from '@/lib/db/practice-menu-types';

import type { LeaderboardModule, LeaderboardPeriod } from './types';
import { VALID_PERIODS } from './types';

const validPeriodSet: ReadonlySet<string> = new Set(VALID_PERIODS);

/**
 * 期間値のバリデーション
 * 有効な期間値か判定する型ガード
 */
export function isValidPeriod(value: string): value is LeaderboardPeriod {
  return validPeriodSet.has(value);
}

/**
 * モジュール値のバリデーション
 * 有効なモジュール値か判定する型ガード
 */
export function isValidModule(value: string): value is LeaderboardModule {
  return isPracticeMenuType(value);
}
