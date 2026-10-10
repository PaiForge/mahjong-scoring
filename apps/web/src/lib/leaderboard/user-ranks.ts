import { unstable_cache } from "next/cache";

import {
  LEADERBOARD_BOARDS,
  type LeaderboardPeriod,
} from "@mahjong-scoring/features/leaderboard/boards";
import {
  practiceBoardKey,
  type PracticeBoard,
} from "@mahjong-scoring/features/practice-menu-types";

import { LEADERBOARD_CACHE_TAG } from "../cache-tags";
import { logExternalError } from "../log-error";

import { getQueriesForPeriod } from "./period-queries";

const REVALIDATE_SECONDS = 300; // 5 minutes

/**
 * ユーザーランク情報
 * ランキング一覧の行に添える、その土俵での本人の順位
 */
export interface UserRankInfo extends PracticeBoard {
  readonly rank: number;
}

/**
 * ユーザーの全土俵（練習 × バリアント）における順位を一括取得する
 * ユーザーランク一括取得
 *
 * web のランキング一覧とアプリ向け API で共有する。順位の無い土俵は含めない。
 *
 * 土俵ごとの取得が失敗しても他の土俵のランクは返す（1 つの土俵の障害で
 * 一覧全体のランク表示を消さない）。失敗は土俵のキー付きで記録し、その
 * 土俵は「ランクなし」として落とす。
 *
 * キャッシュは土俵ごとに持ち、失敗はキャッシュの外で捕まえる。
 * `unstable_cache` は投げた回を保存しないので、一時的な DB 障害が
 * 「ランクなし」として 5 分間残らない。
 *
 * @param userId - 本人の ID
 * @param period - 期間
 */
export async function getUserRanks(
  userId: string,
  period: LeaderboardPeriod,
): Promise<readonly UserRankInfo[]> {
  const { getUserRankedRow, cacheKey } = getQueriesForPeriod(
    period,
    new Date(),
  );

  const fetchRank = async (
    board: PracticeBoard,
  ): Promise<UserRankInfo | undefined> => {
    try {
      const rank = await unstable_cache(
        async () => {
          const row = await getUserRankedRow(
            userId,
            board.menuType,
            board.variant,
          );
          return row?.rank;
        },
        ["user-rank", userId, cacheKey, practiceBoardKey(board)],
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

  const ranks = await Promise.all(LEADERBOARD_BOARDS.map(fetchRank));
  return ranks.filter((rank) => rank !== undefined);
}
