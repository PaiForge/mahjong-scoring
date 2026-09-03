import { sql, type SQL } from "drizzle-orm";

import { db } from "./index";
import { visibleProfileJoinSql } from "./leaderboard-visibility";
import {
  periodResultsWhere,
  startOfCurrentMonth,
  type RankedLeaderboardRow,
} from "./leaderboard-queries";
import { rankingOrderSql } from "./ranking-order";

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
 * `buildRankedRowQuery` に渡せる関係名・別名
 *
 * 生 SQL に直接埋め込むため、外部入力が混じらないよう既知のリテラルに限る。
 */
type RankedSourceAlias = "challenge_best_scores" | "best";

/**
 * ランク付きユーザー行クエリを組み立てる。
 * 内側のデータソース（best_scores 直 or 期間絞り込みサブクエリ）を差し替えつつ、
 * ROW_NUMBER によるランク付与・profiles 結合・対象ユーザー絞り込みを共通化する。
 * ランク行クエリ構築
 *
 * 順位は母集団の行位置で決まるため、ランキング非表示ユーザーの除外は
 * `source` 側（＝ ROW_NUMBER を回す前）で済ませてある。外側の profiles 結合は
 * 表示用の列を足すためのもので、そこで絞ると順位番号に欠番が出る。
 *
 * @param source - ranked サブクエリの FROM に入る SQL 断片
 * @param sourceAlias - `source` の関係名または別名。列の修飾に使い、生 SQL へ
 *   そのまま埋め込むため、コード中のリテラルだけを取れる型にしてある
 * @param userId - 取得対象のユーザーID
 */
function buildRankedRowQuery(
  source: SQL,
  sourceAlias: RankedSourceAlias,
  userId: string,
): SQL {
  return sql`
    SELECT ranked.user_id, ranked.score, ranked.incorrect_answers,
           ranked.time_taken, ranked.rank::int,
           p.username, p.display_name, p.avatar_url
    FROM (
      SELECT
        ${sql.raw(sourceAlias)}.user_id, ${sql.raw(sourceAlias)}.score,
        ${sql.raw(sourceAlias)}.incorrect_answers,
        ${sql.raw(sourceAlias)}.time_taken,
        ROW_NUMBER() OVER (
          ORDER BY ${rankingOrderSql(sourceAlias)}
        ) AS rank
      FROM ${source}
    ) ranked
    INNER JOIN profiles p ON ranked.user_id = p.id
    WHERE ranked.user_id = ${userId}
  `;
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
  const [row] = await db.execute<RawRankedRow>(
    buildRankedRowQuery(
      sql`challenge_best_scores
          ${visibleProfileJoinSql("challenge_best_scores")}
          WHERE challenge_best_scores.menu_type = ${menuType}
            AND challenge_best_scores.leaderboard_key = ${leaderboardKey}`,
      "challenge_best_scores",
      userId,
    ),
  );

  return row ? mapRawRankedRow(row) : undefined;
}

/**
 * 月間ランキングにおけるユーザーのランク付き行を取得する
 * 月間ユーザーランク行取得
 *
 * @param now - 「今」として扱う時刻。一覧を引く {@link getMonthlyRanking} と
 *   同じ値を渡すこと。別々に現在時刻を読むと、月替わりの瞬間に一覧と自分の
 *   順位が違う月を集計する
 */
export async function getUserMonthlyRankedRow(
  userId: string,
  menuType: string,
  leaderboardKey: string,
  now: Date,
): Promise<RankedLeaderboardRow | undefined> {
  const periodStart = startOfCurrentMonth(now);

  const [row] = await db.execute<RawRankedRow>(
    buildRankedRowQuery(
      sql`(
        SELECT DISTINCT ON (challenge_results.user_id)
          challenge_results.user_id, challenge_results.score,
          challenge_results.incorrect_answers, challenge_results.time_taken
        FROM challenge_results
        ${visibleProfileJoinSql("challenge_results")}
        WHERE ${periodResultsWhere(menuType, leaderboardKey, periodStart)}
        ORDER BY challenge_results.user_id, ${rankingOrderSql("challenge_results")}
      ) best`,
      "best",
      userId,
    ),
  );

  return row ? mapRawRankedRow(row) : undefined;
}
