import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { ChevronRightIcon } from "@/app/(user)/_components/icons/chevron-right-icon";
import type { LeaderboardPeriod } from "@mahjong-scoring/features/leaderboard/boards";
import { leaderboardHref } from "@/lib/leaderboard/leaderboard-href";
import { boardTitle } from "../_lib/board-title";
import type { PracticeBoard } from "@mahjong-scoring/features/practice-menu-types";

interface LeaderboardModuleRowProps {
  readonly board: PracticeBoard;
  readonly period: LeaderboardPeriod;
  readonly rank: number | undefined;
  readonly showRank: boolean;
}

/** 分野別パネルの種目リンク。順位列は本人の順位を表示できるときだけ出す。 */
export async function LeaderboardModuleRow({
  board,
  period,
  rank,
  showRank,
}: LeaderboardModuleRowProps) {
  const t = await getTranslations("leaderboard");

  return (
    <li>
      <Link
        href={leaderboardHref(period, board)}
        className="group flex min-h-16 items-center gap-3 px-4 py-4 transition-colors hover:bg-surface-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:px-5"
      >
        <span className="min-w-0 flex-1 text-sm font-bold leading-relaxed text-foreground">
          {await boardTitle(board)}
        </span>
        {showRank && (
          <span className="w-20 shrink-0 text-right">
            {rank !== undefined ? (
              <span className="inline-block rounded-md bg-brand-subtle px-2.5 py-1 text-sm font-bold tabular-nums text-brand-subtle-foreground">
                {t("rankLabel", { rank })}
              </span>
            ) : (
              <span className="text-xs font-medium text-surface-500">
                {t("notRanked")}
              </span>
            )}
          </span>
        )}
        <span
          aria-hidden="true"
          className="shrink-0 text-surface-400 group-hover:text-foreground"
        >
          <ChevronRightIcon />
        </span>
      </Link>
    </li>
  );
}
