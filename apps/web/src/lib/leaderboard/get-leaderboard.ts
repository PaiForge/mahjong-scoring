import { unstable_cache } from "next/cache";

import {
  isLeaderboardBoard,
  isLeaderboardPeriod,
  type LeaderboardPeriod,
} from "@mahjong-scoring/features/leaderboard/boards";
import type { PracticeBoard } from "@mahjong-scoring/features/practice-menu-types";

import { LEADERBOARD_CACHE_TAG } from "../cache-tags";
import type { RankedLeaderboardRow } from "../db/leaderboard-queries";
import { logExternalError } from "../log-error";
import {
  DEFAULT_PAGE_SIZE,
  getPaginationData,
  resolvePagination,
} from "../pagination";

import { getQueriesForPeriod } from "./period-queries";

/** ランキング 1 ページの人数（アプリ共通の既定値に揃える） */
export const LEADERBOARD_PAGE_SIZE = DEFAULT_PAGE_SIZE;

/**
 * リーダーボード結果
 * ランキングの取得結果
 */
export interface LeaderboardResult {
  readonly rows: readonly RankedLeaderboardRow[];
  readonly totalCount: number;
  /** 行が属するページ（範囲外を要求したら最後のページに丸めた後の番号） */
  readonly page: number;
  /** 閲覧者がこのページにいないときの、閲覧者の順位の行 */
  readonly currentUserRank: RankedLeaderboardRow | undefined;
}

/**
 * 空のランキング（誰も挑戦していない土俵と同じ見た目）
 *
 * web は取得の失敗をこれで描く — ページの本体は土俵の名前と挑戦の導線で、
 * 表が出ないだけで済むため。
 */
export const EMPTY_LEADERBOARD: LeaderboardResult = {
  rows: [],
  totalCount: 0,
  page: 1,
  currentUserRank: undefined,
};

const REVALIDATE_SECONDS = 300; // 5 minutes

/** 全員で共有する、土俵・期間・ページのランキング */
function getCachedRanking(
  board: PracticeBoard,
  period: LeaderboardPeriod,
  offset: number,
  limit: number,
  now: Date,
) {
  const { getRanking, cacheKey } = getQueriesForPeriod(period, now);
  return unstable_cache(
    async () => getRanking(board.menuType, board.variant, offset, limit),
    [
      "leaderboard-ranking",
      board.menuType,
      board.variant,
      cacheKey,
      String(offset),
      String(limit),
    ],
    { revalidate: REVALIDATE_SECONDS, tags: [LEADERBOARD_CACHE_TAG] },
  )();
}

/**
 * リーダーボードデータを取得する
 * リーダーボード取得
 *
 * web のページとアプリ向け API で共有する。ランキングの行は全員で共有する
 * キャッシュから引き、閲覧者の順位だけを閲覧者ごとに引く。ブロックした人の
 * 除外は呼び出し側が行う（`withoutBlocked`。順位は数え直さない）。
 *
 * 範囲外のページ（20 人しかいないのに `?page=9`）は最後のページに丸め、
 * そのページの行と番号（`page`）を返す。
 *
 * 土俵・期間・ページが不正なら空。DB の失敗は記録して undefined を返し、
 * 空で描くか失敗として返すかは呼び出し側が決める。
 *
 * @param board - 土俵（練習種別とバリアント）
 * @param period - 期間（all-time / monthly）
 * @param page - ページ番号（1始まり）
 * @param currentUserId - 閲覧者の ID。順位の行を引かないなら省く
 */
export async function getLeaderboard(
  board: PracticeBoard,
  period: LeaderboardPeriod,
  page: number,
  currentUserId?: string,
): Promise<LeaderboardResult | undefined> {
  if (!isLeaderboardBoard(board) || !isLeaderboardPeriod(period) || page < 1) {
    return EMPTY_LEADERBOARD;
  }

  const requested = getPaginationData(page, 0, LEADERBOARD_PAGE_SIZE);

  // 一覧と「自分の順位」で同じ「今」を使う。別々に現在時刻を読むと、
  // 月替わりの瞬間に一覧が前月・自分の順位が当月（またはその逆）になる。
  const now = new Date();

  try {
    // 件数は行と同じ 1 回の取得で返るため、要求されたページのまま引き、
    // 範囲外だったと分かったときだけ最後のページを引き直す。そのまま返すと
    // OFFSET の先の空配列を掴み、挑戦者がいるのに「記録なし」の表になる
    const first = await getCachedRanking(
      board,
      period,
      requested.offset,
      requested.limit,
      now,
    );
    const { currentPage, limit, offset } = resolvePagination(
      page,
      first.total,
      LEADERBOARD_PAGE_SIZE,
    );

    const { rows, total } =
      currentPage === requested.currentPage
        ? first
        : await getCachedRanking(board, period, offset, limit, now);

    const leaderboardRows: RankedLeaderboardRow[] = rows.map((r, i) => ({
      ...r,
      rank: offset + i + 1,
    }));

    let currentUserRank: RankedLeaderboardRow | undefined;
    if (
      currentUserId &&
      !leaderboardRows.some((r) => r.userId === currentUserId)
    ) {
      const { getUserRankedRow } = getQueriesForPeriod(period, now);
      currentUserRank = await getUserRankedRow(
        currentUserId,
        board.menuType,
        board.variant,
      );
    }

    return {
      rows: leaderboardRows,
      totalCount: total,
      page: currentPage,
      currentUserRank,
    };
  } catch (error) {
    logExternalError("getLeaderboard", "DB query failed", error);
    return undefined;
  }
}
