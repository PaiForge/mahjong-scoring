import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { SectionTitle } from "@/app/_components/section-title";
import { LeaderboardTableHeader } from "@/app/(user)/(public)/leaderboard/_components/leaderboard-table-header";
import { LeaderboardTableRow } from "@/app/(user)/(public)/leaderboard/_components/leaderboard-table-row";
import type { RankedLeaderboardRow } from "@/lib/db/leaderboard-queries";
import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";

interface LeaderboardPreviewProps {
  readonly rows: readonly RankedLeaderboardRow[];
  readonly detailPath: string;
}

/**
 * リーダーボードプレビュー
 * 全期間ランキング上位3名の表示
 */
export async function LeaderboardPreview({
  rows,
  detailPath,
}: LeaderboardPreviewProps) {
  const t = await getTranslations("leaderboard");

  if (rows.length === 0) {
    return undefined;
  }

  return (
    <div className="min-h-[280px] space-y-3">
      <SectionTitle>{t("allTimeRanking")}</SectionTitle>
      <div>
        <table className="w-full table-fixed" aria-label={t("allTimeRanking")}>
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
          className={`text-sm font-medium ${TEXT_LINK_CLASSES}`}
        >
          {t("viewMore")}
        </Link>
      </div>
    </div>
  );
}
