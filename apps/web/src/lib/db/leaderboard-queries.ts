import { and, eq, gte, sql } from "drizzle-orm";

import { db } from "./index";
import { rankingOrder } from "./ranking-order";
import { challengeBestScores, challengeResults, profiles } from "./schema";

/**
 * リーダーボード行
 * ランキング表示用の1行分のデータ
 */
export interface LeaderboardRow {
  readonly userId: string;
  readonly username: string;
  readonly score: number;
  readonly incorrectAnswers: number;
  readonly timeTaken: number;
  readonly displayName: string | undefined;
  readonly avatarUrl: string | undefined;
}

/**
 * ランク付きリーダーボード行
 * 順位情報を含むランキング表示用の1行分のデータ
 */
export interface RankedLeaderboardRow extends LeaderboardRow {
  readonly rank: number;
}

/**
 * リーダーボードページ
 * ページネーション付きランキング結果
 */
export interface LeaderboardPage {
  readonly rows: readonly LeaderboardRow[];
  readonly total: number;
}

/**
 * 順位結果
 * ユーザーの順位情報
 */
export interface RankResult {
  readonly rank: number;
}

/**
 * クエリ結果の行を LeaderboardRow へ正規化する
 * ランキング行正規化
 *
 * profiles 由来の nullable カラムを、公開型に合わせて undefined に寄せる。
 */
function toLeaderboardRow(row: {
  readonly userId: string;
  readonly username: string;
  readonly score: number;
  readonly incorrectAnswers: number;
  readonly timeTaken: number;
  readonly displayName: string | null;
  readonly avatarUrl: string | null;
}): LeaderboardRow {
  return {
    ...row,
    displayName: row.displayName ?? undefined,
    avatarUrl: row.avatarUrl ?? undefined,
  };
}

/**
 * 当月の開始日時（UTC）を返す
 * 月初日時取得
 */
export function startOfCurrentMonth(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

// ---------------------------------------------------------------------------
// All-time ranking (from challenge_best_scores)
// ---------------------------------------------------------------------------

/**
 * 全期間ランキングを取得する
 * 全期間ランキング取得
 */
export async function getAllTimeRanking(
  menuType: string,
  leaderboardKey: string,
  offset: number,
  limit: number,
): Promise<LeaderboardPage> {
  const rows = await db
    .select({
      userId: challengeBestScores.userId,
      username: profiles.username,
      score: challengeBestScores.score,
      incorrectAnswers: challengeBestScores.incorrectAnswers,
      timeTaken: challengeBestScores.timeTaken,
      displayName: profiles.displayName,
      avatarUrl: profiles.avatarUrl,
    })
    .from(challengeBestScores)
    .innerJoin(profiles, eq(challengeBestScores.userId, profiles.id))
    .where(
      and(
        eq(challengeBestScores.menuType, menuType),
        eq(challengeBestScores.leaderboardKey, leaderboardKey),
      ),
    )
    .orderBy(...rankingOrder(challengeBestScores))
    .offset(offset)
    .limit(limit);

  const [countRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(challengeBestScores)
    .where(
      and(
        eq(challengeBestScores.menuType, menuType),
        eq(challengeBestScores.leaderboardKey, leaderboardKey),
      ),
    );

  return {
    rows: rows.map(toLeaderboardRow),
    total: countRow?.count ?? 0,
  };
}

// ---------------------------------------------------------------------------
// Period ranking (from challenge_results with DISTINCT ON)
// ---------------------------------------------------------------------------

async function getPeriodRanking(
  menuType: string,
  leaderboardKey: string,
  periodStart: Date,
  offset: number,
  limit: number,
): Promise<LeaderboardPage> {
  const bestPerUser = db
    .selectDistinctOn([challengeResults.userId], {
      userId: challengeResults.userId,
      score: challengeResults.score,
      incorrectAnswers: challengeResults.incorrectAnswers,
      timeTaken: challengeResults.timeTaken,
    })
    .from(challengeResults)
    .where(
      and(
        eq(challengeResults.menuType, menuType),
        eq(challengeResults.leaderboardKey, leaderboardKey),
        gte(challengeResults.createdAt, periodStart),
      ),
    )
    .orderBy(challengeResults.userId, ...rankingOrder(challengeResults))
    .as("best_per_user");

  const rows = await db
    .select({
      userId: bestPerUser.userId,
      username: profiles.username,
      score: bestPerUser.score,
      incorrectAnswers: bestPerUser.incorrectAnswers,
      timeTaken: bestPerUser.timeTaken,
      displayName: profiles.displayName,
      avatarUrl: profiles.avatarUrl,
    })
    .from(bestPerUser)
    .innerJoin(profiles, eq(bestPerUser.userId, profiles.id))
    .orderBy(...rankingOrder(bestPerUser))
    .offset(offset)
    .limit(limit);

  const [countRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(bestPerUser);

  return {
    rows: rows.map(toLeaderboardRow),
    total: countRow?.count ?? 0,
  };
}

/**
 * 月間ランキングを取得する
 * 月間ランキング取得
 */
export async function getMonthlyRanking(
  menuType: string,
  leaderboardKey: string,
  offset: number,
  limit: number,
): Promise<LeaderboardPage> {
  return getPeriodRanking(
    menuType,
    leaderboardKey,
    startOfCurrentMonth(),
    offset,
    limit,
  );
}
