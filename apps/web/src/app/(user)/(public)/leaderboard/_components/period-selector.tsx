import Link from "next/link";
import { getTranslations } from "next-intl/server";

import type { LeaderboardModule, LeaderboardPeriod } from "../_lib/types";
import { VALID_PERIODS, buildDetailPath } from "../_lib/types";
import {
  TOGGLE_GROUP_CONTAINER_CLASSES,
  toggleItemClasses,
} from "@/app/(user)/_components/_lib/toggle-group-classes";

interface PeriodSelectorProps {
  readonly currentPeriod: LeaderboardPeriod;
  readonly module: LeaderboardModule;
}

/**
 * 期間セレクター
 * リーダーボードの期間切り替えコンポーネント
 */
export async function PeriodSelector({
  currentPeriod,
  module: mod,
}: PeriodSelectorProps) {
  const t = await getTranslations("leaderboard");

  return (
    <div className={TOGGLE_GROUP_CONTAINER_CLASSES}>
      {VALID_PERIODS.map((p) => (
        <Link
          key={p}
          href={buildDetailPath(p, mod)}
          className={toggleItemClasses(currentPeriod === p)}
        >
          {t(`period.${p}`)}
        </Link>
      ))}
    </div>
  );
}
