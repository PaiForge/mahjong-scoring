"use server";

import { unstable_cache } from "next/cache";

import { getOptionalUser } from "@/lib/auth";
import { LEADERBOARD_CACHE_TAG } from "@/lib/cache-tags";
import { logExternalError } from "@/lib/log-error";

import { getQueriesForPeriod } from "../_lib/period-queries";
import type { LeaderboardPeriod, UserRankInfo } from "../_lib/types";
import { BOARDS } from "../_lib/types";
import type { PracticeBoard } from "@mahjong-scoring/features/practice-menu-types";
import { practiceBoardKey } from "@mahjong-scoring/features/practice-menu-types";

const REVALIDATE_SECONDS = 300; // 5 minutes

/**
 * 認証済みユーザーの全土俵（練習 × バリアント）におけるランクを一括取得する。
 * 未認証の場合は空配列を返す。
 * ユーザーランク一括取得
 *
 * 土俵ごとの取得が失敗しても他の土俵のランクは返す（1 つの土俵の障害で
 * 一覧全体のランク表示を消さない）。失敗は土俵のキー付きで記録し、その
 * 土俵は「ランクなし」として落とす。
 *
 * キャッシュは土俵ごとに持ち、失敗はキャッシュの外で捕まえる。
 * `unstable_cache` は投げた回を保存しないので、一時的な DB 障害が
 * 「ランクなし」として 5 分間残らない。
 *
 * @param period - 期間
 */
export async function getUserRanks(
  period: LeaderboardPeriod,
): Promise<readonly UserRankInfo[]> {
  const user = await getOptionalUser();

  if (!user) {
    return [];
  }

  const userId = user.id;
  const now = new Date();

  const fetchRank = async (
    board: PracticeBoard,
  ): Promise<UserRankInfo | undefined> => {
    try {
      const rank = await unstable_cache(
        async () => {
          const { getUserRankedRow } = getQueriesForPeriod(period, now);
          const row = await getUserRankedRow(
            userId,
            board.menuType,
            board.variant,
          );
          return row?.rank;
        },
        ["user-rank", userId, period, practiceBoardKey(board)],
        { revalidate: REVALIDATE_SECONDS, tags: [LEADERBOARD_CACHE_TAG] },
      )();
      return rank === undefined ? undefined : { ...board, rank };
    } catch (error) {
      logExternalError(
        "getUserRanks",
        `${practiceBoardKey(board)}: failed to fetch user rank`,
        error,
      );
      return undefined;
    }
  };

  const ranks = await Promise.all(BOARDS.map(fetchRank));
  return ranks.filter((rank) => rank !== undefined);
}
