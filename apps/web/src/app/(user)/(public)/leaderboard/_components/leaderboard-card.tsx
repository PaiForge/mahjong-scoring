import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { menuTypeToMessageKey } from "@/lib/db/practice-menu-types";

import type { LeaderboardModule, LeaderboardPeriod } from "../_lib/types";
import { buildDetailPath } from "../_lib/types";

interface LeaderboardCardProps {
  readonly module: LeaderboardModule;
  readonly period: LeaderboardPeriod;
  readonly rank: number | undefined;
}

/**
 * リーダーボードカード
 * 一覧ページで各モジュールのランキング概要を表示するカード
 */
export async function LeaderboardCard({
  module,
  period,
  rank,
}: LeaderboardCardProps) {
  const t = await getTranslations("leaderboard");

  const msgKey = menuTypeToMessageKey(module);
  const title = t(`module.${msgKey}`);
  const detailPath = buildDetailPath(period, module);

  return (
    <Link
      href={detailPath}
      className="press-sm group block rounded-lg border-3 border-ink bg-white p-4 shadow-sm hover:bg-primary-50"
    >
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border-2 border-ink bg-primary-50 text-lg">
          {t(`moduleIcon.${msgKey}`)}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold text-surface-700">{title}</h3>
          {rank !== undefined ? (
            <p className="text-lg font-semibold text-primary-600 tabular-nums">
              {t("rankLabel", { rank })}
            </p>
          ) : (
            <p className="text-sm text-surface-400">{t("notRanked")}</p>
          )}
        </div>
      </div>
    </Link>
  );
}
