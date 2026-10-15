import type { ReactNode } from "react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { SectionTitle } from "@/app/(user)/_components/section-title";
import { LeaderboardTableHeader } from "@/app/(user)/(public)/leaderboard/_components/leaderboard-table-header";
import { LeaderboardTableRow } from "@/app/(user)/(public)/leaderboard/_components/leaderboard-table-row";
import type { RankedLeaderboardRow } from "@/lib/db/leaderboard-queries";
import { getLeaderboard } from "@/lib/leaderboard/get-leaderboard";
import { getOptionalUser } from "@/lib/auth";
import { getBlockedUserIds, withoutBlocked } from "@/lib/blocks/blocks";
import { leaderboardHref } from "@/lib/leaderboard/leaderboard-href";
import type { PracticeBoard } from "@mahjong-scoring/features/practice-menu-types";
import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";

interface LeaderboardPreviewProps {
  readonly rows: readonly RankedLeaderboardRow[];
  readonly detailPath: string;
  /** 「もっと見る」の下に続けて置くもの。上位が空でセクションごと出ないときは出さない */
  readonly footer?: ReactNode;
}

/**
 * リーダーボードプレビュー
 * 全期間ランキング上位3名の表示
 */
export async function LeaderboardPreview({
  rows,
  detailPath,
  footer,
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
      {footer && <div className="pt-3">{footer}</div>}
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
 *
 * `guestFooter` は未ログインの閲覧者にだけ表の下へ続けて出す（結果ページの
 * 登録 CTA）。ログイン状態はここで既に引いているので、呼び出し側で引き直さない。
 */
export async function BoardLeaderboardPreview({
  board,
  guestFooter,
}: {
  readonly board: PracticeBoard;
  readonly guestFooter?: ReactNode;
}) {
  const user = await getOptionalUser();
  const [result, blockedIds] = await Promise.all([
    getLeaderboard(board, "all-time", 1),
    getBlockedUserIds(user?.id),
  ]);

  return (
    <LeaderboardPreview
      // 取得の失敗は誰もいない土俵と同じく出さない
      rows={withoutBlocked(result?.rows ?? [], blockedIds).slice(
        0,
        PREVIEW_COUNT,
      )}
      detailPath={leaderboardHref("all-time", board)}
      footer={user ? undefined : guestFooter}
    />
  );
}
