import Link from "next/link";
import { getTranslations } from "next-intl/server";

import {
  LEADERBOARD_PERIODS,
  type LeaderboardPeriod,
} from "@mahjong-scoring/features/leaderboard/boards";
import { leaderboardHref } from "@mahjong-scoring/features/routes";
import {
  TOGGLE_GROUP_CONTAINER_CLASSES,
  toggleItemClasses,
} from "@/app/(user)/_components/_lib/toggle-group-classes";
import type { PracticeBoard } from "@mahjong-scoring/features/practice-menu-types";

interface PeriodSelectorProps {
  readonly currentPeriod: LeaderboardPeriod;
  readonly board: PracticeBoard;
}

/**
 * 期間セレクター
 * リーダーボードの期間切り替えコンポーネント
 */
export async function PeriodSelector({
  currentPeriod,
  board,
}: PeriodSelectorProps) {
  const t = await getTranslations("leaderboard");

  return (
    <div className={TOGGLE_GROUP_CONTAINER_CLASSES}>
      {LEADERBOARD_PERIODS.map((p) => (
        <Link
          key={p}
          href={leaderboardHref(p, board)}
          className={toggleItemClasses(currentPeriod === p)}
        >
          {t(`period.${p}`)}
        </Link>
      ))}
    </div>
  );
}
