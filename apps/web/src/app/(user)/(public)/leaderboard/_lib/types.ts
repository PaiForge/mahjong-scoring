import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import type { PracticeBoard } from "@mahjong-scoring/features/practice-menu-types";
import type { RankedLeaderboardRow } from "@/lib/db/leaderboard-queries";

/**
 * リーダーボード結果
 * ランキングの取得結果
 */
export interface LeaderboardResult {
  readonly rows: readonly RankedLeaderboardRow[];
  readonly totalCount: number;
  readonly currentUserRank: RankedLeaderboardRow | undefined;
}

/**
 * ユーザーランク情報
 * 一覧ページでカードに表示するランク情報
 */
export interface UserRankInfo extends PracticeBoard {
  readonly rank: number;
}

/** 1ページあたりの表示件数（アプリ共通の既定値に揃える） */
export const PAGE_SIZE = DEFAULT_PAGE_SIZE;
