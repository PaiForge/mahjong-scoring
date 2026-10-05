import { getTranslations } from "next-intl/server";

import { LinkRowList } from "@/app/(user)/_components/link-row";
import { NativeAdRow } from "@/app/(user)/_components/native-ad-row";
import { SectionTitle } from "@/app/(user)/_components/section-title";
import { getNativeAdPlacements } from "@/lib/ads/creatives";
import { adIndexAfterGroup } from "@/lib/ads/spacing";
import { getOptionalUser } from "@/lib/auth";
import { isHiddenFromLeaderboard } from "@/lib/db/leaderboard-visibility";

import { getUserRanks } from "../_actions/get-user-ranks";
import { leaderboardBoardGroups } from "../_lib/board-groups";
import type { LeaderboardPeriod, UserRankInfo } from "../_lib/types";
import { LeaderboardModuleRow } from "./leaderboard-module-row";
import { practiceBoardKey } from "@mahjong-scoring/features/practice-menu-types";

interface LeaderboardTopContentProps {
  readonly period: LeaderboardPeriod;
}

/**
 * リーダーボード一覧コンテンツ
 * 全土俵（練習 × バリアント）のランキングを分野ごとに行リンクで並べる
 *
 * ランキング非表示中の案内（`ViewerHiddenNote`）はここでは出さない。
 * 順位が出ない土俵の表（詳細ページ）で必ず目に入るため、一覧にも置くと
 * 同じ知らせを二度読ませることになる。
 *
 * 分野の末尾にネイティブ広告を 1 行ずつ、間隔を広げながら混ぜる
 * （`adIndexAfterGroup`。掲載中の広告があるときだけ）。
 */
export async function LeaderboardTopContent({
  period,
}: LeaderboardTopContentProps) {
  const [tPractice, user, ads] = await Promise.all([
    getTranslations("practice"),
    getOptionalUser(),
    getNativeAdPlacements("leaderboard-index-native-ad"),
  ]);
  const currentUserId = user?.id ?? undefined;

  const viewerHidden =
    currentUserId === undefined
      ? false
      : await isHiddenFromLeaderboard(currentUserId);

  let userRanks: readonly UserRankInfo[] = [];
  // 非表示中はどのモジュールでも順位が付かない。モジュール数ぶんの
  // ROW_NUMBER クエリを空振りさせないよう手前で打ち切る。
  if (currentUserId && !viewerHidden) {
    userRanks = await getUserRanks(period);
  }

  const rankMap = new Map<string, number>(
    userRanks.map((r) => [practiceBoardKey(r), r.rank]),
  );

  return (
    <div className="space-y-8">
      {leaderboardBoardGroups().map((group, groupIndex) => {
        const adIndex = adIndexAfterGroup(groupIndex);
        const ad = adIndex === undefined ? undefined : ads[adIndex];
        return (
          <section key={group.category} className="space-y-3">
            <SectionTitle>
              {tPractice(`categories.${group.category}.title`)}
            </SectionTitle>

            <LinkRowList>
              {group.boards.map((board) => (
                <LeaderboardModuleRow
                  key={practiceBoardKey(board)}
                  board={board}
                  period={period}
                  rank={
                    currentUserId
                      ? rankMap.get(practiceBoardKey(board))
                      : undefined
                  }
                />
              ))}
              {/* ここは土俵を選ぶ一覧で、順位の表（詳細ページ）には置かない
                （registry の TSDoc 参照） */}
              {ad && <NativeAdRow creative={ad} />}
            </LinkRowList>
          </section>
        );
      })}
    </div>
  );
}
