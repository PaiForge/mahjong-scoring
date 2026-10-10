import { getPaginationData } from "@/lib/pagination";

import {
  LEADERBOARD_PAGE_SIZE,
  type LeaderboardResult,
} from "@/lib/leaderboard/get-leaderboard";
import { LeaderboardPagination } from "./leaderboard-pagination";
import { LeaderboardTable } from "./leaderboard-table";

interface LeaderboardDetailContentProps {
  readonly currentUserId: string | undefined;
  readonly data: LeaderboardResult;
  readonly currentPage: number;
  /** 閲覧者が自分でランキング非表示にしているか */
  readonly viewerHidden: boolean;
}

/**
 * リーダーボード詳細コンテンツ
 * ページネーション付きランキング表示
 *
 * 期間の切り替え（総合 / 月間）はここには無い。URL だけで決まりランキングの
 * 取得を待たないため、ページ側が Suspense の外で描く。
 */
export function LeaderboardDetailContent({
  currentUserId,
  data,
  currentPage,
  viewerHidden,
}: LeaderboardDetailContentProps) {
  const { totalPages } = getPaginationData(
    currentPage,
    data.totalCount,
    LEADERBOARD_PAGE_SIZE,
  );

  return (
    <div>
      <LeaderboardTable
        rows={data.rows}
        currentUserId={currentUserId}
        currentUserRank={data.currentUserRank}
        viewerHidden={viewerHidden}
      />
      <LeaderboardPagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalCount={data.totalCount}
      />
    </div>
  );
}
