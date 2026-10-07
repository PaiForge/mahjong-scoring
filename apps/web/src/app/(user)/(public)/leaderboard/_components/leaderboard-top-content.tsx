import { getTranslations } from "next-intl/server";

import Link from "next/link";
import { FOCUS_RING_CLASSES } from "@/app/_components/_lib/link-classes";
import { NativeAdRow } from "@/app/(user)/_components/native-ad-row";
import { SectionTitle } from "@/app/(user)/_components/section-title";
import { getNativeAdPlacements } from "@/lib/ads/creatives";
import { adIndexAfterGroup } from "@/lib/ads/spacing";
import { getOptionalUser } from "@/lib/auth";
import { isHiddenFromLeaderboard } from "@/lib/db/leaderboard-visibility";

import { getUserRanks } from "../_actions/get-user-ranks";
import { leaderboardBoardGroups } from "../_lib/board-groups";
import { VALID_PERIODS } from "../_lib/types";
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
 * （`adIndexAfterGroup`。掲載中の広告があるときだけ）。広告はパネルの
 * 最後の行として入れる — パネルの外に置くと、枠の無い行が 1 本だけ浮く。
 * `data-framed` は広告の行（`NativeAdRow`）が枠の中の余白に切り替える目印。
 */
export async function LeaderboardTopContent({
  period,
}: LeaderboardTopContentProps) {
  const [tPractice, t, user, ads] = await Promise.all([
    getTranslations("practice"),
    getTranslations("leaderboard"),
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

  const showRank = currentUserId !== undefined && !viewerHidden;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-medium leading-relaxed text-surface-500">
          {t("indexDescription")}
        </p>
        <nav
          aria-label={t("periodLabel")}
          className="flex shrink-0 self-start rounded-lg border border-panel bg-surface-50 p-1"
        >
          {VALID_PERIODS.map((value) => (
            <Link
              key={value}
              href={
                value === "all-time"
                  ? "/leaderboard"
                  : "/leaderboard?period=monthly"
              }
              aria-current={period === value ? "page" : undefined}
              className={`rounded-md px-5 py-2 text-sm font-bold transition-colors ${FOCUS_RING_CLASSES} ${period === value ? "bg-primary-700 text-white" : "text-surface-500 hover:bg-surface-100 hover:text-foreground"}`}
            >
              {t(`period.${value}`)}
            </Link>
          ))}
        </nav>
      </div>
      {leaderboardBoardGroups().map((group, groupIndex) => {
        const adIndex = adIndexAfterGroup(groupIndex);
        const ad = adIndex === undefined ? undefined : ads[adIndex];
        return (
          <section key={group.category} className="space-y-3">
            <SectionTitle>
              {tPractice(`categories.${group.category}.title`)}
            </SectionTitle>

            <div className="overflow-hidden rounded-panel border border-panel bg-card">
              <div className="flex items-center justify-between gap-3 border-b border-panel bg-surface-50 px-4 py-2.5 text-xs font-medium text-surface-500 sm:px-5">
                <span>{t("boardLabel")}</span>
                {showRank && <span className="pr-7">{t("yourRankLabel")}</span>}
              </div>
              <ul
                data-framed=""
                className="group/rows divide-y divide-surface-100"
              >
                {group.boards.map((board) => (
                  <LeaderboardModuleRow
                    key={practiceBoardKey(board)}
                    board={board}
                    period={period}
                    showRank={showRank}
                    rank={
                      currentUserId
                        ? rankMap.get(practiceBoardKey(board))
                        : undefined
                    }
                  />
                ))}
                {ad && <NativeAdRow creative={ad} />}
              </ul>
            </div>
          </section>
        );
      })}
    </div>
  );
}
