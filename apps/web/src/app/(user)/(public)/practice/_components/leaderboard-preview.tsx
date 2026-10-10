import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { SectionTitle } from "@/app/(user)/_components/section-title";
import { LeaderboardTableHeader } from "@/app/(user)/(public)/leaderboard/_components/leaderboard-table-header";
import { LeaderboardTableRow } from "@/app/(user)/(public)/leaderboard/_components/leaderboard-table-row";
import type { RankedLeaderboardRow } from "@/lib/db/leaderboard-queries";
import { getLeaderboard } from "@/app/(user)/(public)/leaderboard/_actions/get-leaderboard";
import { getOptionalUser } from "@/lib/auth";
import { getBlockedUserIds, withoutBlocked } from "@/lib/blocks/blocks";
import { buildDetailPath } from "@/app/(user)/(public)/leaderboard/_lib/types";
import type { PracticeBoard } from "@mahjong-scoring/features/practice-menu-types";
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
    <div className="min-h-[310px] space-y-3">
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

/** プレビューに出す人数 */
const PREVIEW_COUNT = 3;

/**
 * 土俵の全期間ランキング上位を引いて {@link LeaderboardPreview} を描画する
 * 土俵別リーダーボードプレビュー
 *
 * @remarks
 * 結果ページと練習の説明ページ（`renderLeaderboardPreview` 経由）で共有する。
 * 閲覧者がブロックした人は除く（順位は数え直さないので、上位が 1・2・4 位に
 * なることがある）。どちらの呼び出し元もリクエストごとに描くので cookie を読める。
 */
export async function BoardLeaderboardPreview({
  board,
}: {
  readonly board: PracticeBoard;
}) {
  const user = await getOptionalUser();
  const [{ rows }, blockedIds] = await Promise.all([
    getLeaderboard(board, "all-time", 1),
    getBlockedUserIds(user?.id),
  ]);

  return (
    <LeaderboardPreview
      rows={withoutBlocked(rows, blockedIds).slice(0, PREVIEW_COUNT)}
      detailPath={buildDetailPath("all-time", board)}
    />
  );
}
