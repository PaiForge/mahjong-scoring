import { and, asc, desc, eq, gte, sql } from 'drizzle-orm';

import { db } from './index';
import { challengeBestScores, challengeResults, profiles } from './schema';

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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function startOfCurrentMonth(): Date {
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
    .orderBy(
      desc(challengeBestScores.score),
      asc(challengeBestScores.incorrectAnswers),
      asc(challengeBestScores.timeTaken),
    )
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
    rows: rows.map((r) => ({
      ...r,
      displayName: r.displayName ?? undefined,
      avatarUrl: r.avatarUrl ?? undefined,
    })),
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
    .orderBy(
      challengeResults.userId,
      desc(challengeResults.score),
      asc(challengeResults.incorrectAnswers),
      asc(challengeResults.timeTaken),
    )
    .as('best_per_user');

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
    .orderBy(desc(bestPerUser.score), asc(bestPerUser.incorrectAnswers), asc(bestPerUser.timeTaken))
    .offset(offset)
    .limit(limit);

  const [countRow] = await db.select({ count: sql<number>`count(*)::int` }).from(bestPerUser);

  return {
    rows: rows.map((r) => ({
      ...r,
      displayName: r.displayName ?? undefined,
      avatarUrl: r.avatarUrl ?? undefined,
    })),
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
  return getPeriodRanking(menuType, leaderboardKey, startOfCurrentMonth(), offset, limit);
}

// ---------------------------------------------------------------------------
// User's ranked row (rank + full profile data for "your rank" display)
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- db.execute<T> constrains T to Record<string, unknown>, incompatible with interface index signatures
type RawRankedRow = {
  readonly user_id: string;
  readonly username: string;
  readonly score: number;
  readonly incorrect_answers: number;
  readonly time_taken: number;
  readonly display_name: string | null;
  readonly avatar_url: string | null;
  readonly rank: number;
};

function mapRawRankedRow(row: RawRankedRow): RankedLeaderboardRow {
  return {
    rank: row.rank,
    userId: row.user_id,
    username: row.username,
    score: row.score,
    incorrectAnswers: row.incorrect_answers,
    timeTaken: row.time_taken,
    displayName: row.display_name ?? undefined,
    avatarUrl: row.avatar_url ?? undefined,
  };
}

/**
 * 全期間ランキングにおけるユーザーのランク付き行を取得する
 * 全期間ユーザーランク行取得
 */
export async function getUserAllTimeRankedRow(
  userId: string,
  menuType: string,
  leaderboardKey: string,
): Promise<RankedLeaderboardRow | undefined> {
  const [row] = await db.execute<RawRankedRow>(sql`
    SELECT ranked.user_id, ranked.score, ranked.incorrect_answers,
           ranked.time_taken, ranked.rank::int,
           p.username, p.display_name, p.avatar_url
    FROM (
      SELECT
        user_id, score, incorrect_answers, time_taken,
        ROW_NUMBER() OVER (
          ORDER BY score DESC, incorrect_answers ASC, time_taken ASC
        ) AS rank
      FROM challenge_best_scores
      WHERE menu_type = ${menuType}
        AND leaderboard_key = ${leaderboardKey}
    ) ranked
    INNER JOIN profiles p ON ranked.user_id = p.id
    WHERE ranked.user_id = ${userId}
  `);

  return row ? mapRawRankedRow(row) : undefined;
}

/**
 * 月間ランキングにおけるユーザーのランク付き行を取得する
 * 月間ユーザーランク行取得
 */
export async function getUserMonthlyRankedRow(
  userId: string,
  menuType: string,
  leaderboardKey: string,
): Promise<RankedLeaderboardRow | undefined> {
  const periodStart = startOfCurrentMonth();

  const [row] = await db.execute<RawRankedRow>(sql`
    SELECT ranked.user_id, ranked.score, ranked.incorrect_answers,
           ranked.time_taken, ranked.rank::int,
           p.username, p.display_name, p.avatar_url
    FROM (
      SELECT
        user_id, score, incorrect_answers, time_taken,
        ROW_NUMBER() OVER (
          ORDER BY score DESC, incorrect_answers ASC, time_taken ASC
        ) AS rank
      FROM (
        SELECT DISTINCT ON (user_id)
          user_id, score, incorrect_answers, time_taken
        FROM challenge_results
        WHERE menu_type = ${menuType}
          AND leaderboard_key = ${leaderboardKey}
          AND created_at >= ${periodStart.toISOString()}
        ORDER BY user_id, score DESC, incorrect_answers ASC, time_taken ASC
      ) best
    ) ranked
    INNER JOIN profiles p ON ranked.user_id = p.id
    WHERE ranked.user_id = ${userId}
  `);

  return row ? mapRawRankedRow(row) : undefined;
}
