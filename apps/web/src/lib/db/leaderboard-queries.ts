import { and, eq, gte, sql } from "drizzle-orm";

import { db } from "./index";
import { notHiddenFromLeaderboard } from "./leaderboard-visibility";
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
 * `now` が属する月の開始日時（UTC）を返す
 * 月初日時取得
 *
 * `now` を引数で受け取る純粋関数。内部で現在時刻を読むと月の境界をテストで
 * 固定できず、同一リクエスト内の一覧取得と自分の順位取得が別々の「今」を
 * 見て月をまたぐ余地が残る（練習実績の期間集計も同じ理由で `now` を注入する）。
 *
 * 境界は UTC で切る。JST 基準のヒートマップとは基準が異なり、JST で翌月に
 * 入っていても UTC がまだ当月なら前月を集計する。
 *
 * @param now - 「今」として扱う時刻。呼び出し側で1回だけ `new Date()` して渡す
 */
export function startOfCurrentMonth(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

/**
 * 期間ランキングの母集団を絞る条件
 * 期間ランキング母集団
 *
 * 「当月の challenge_results をユーザーごとに最良1件」という母集団定義のうち、
 * 対象行の絞り込み部分の唯一の定義。Drizzle のクエリビルダから組む一覧取得と、
 * 生 SQL で ROW_NUMBER を回すユーザーランク取得の双方がここを通る
 * （期間の粒度を変えるときに片方だけ直す事故を防ぐ）。
 */
export function periodResultsWhere(
  menuType: string,
  leaderboardKey: string,
  periodStart: Date,
) {
  return and(
    eq(challengeResults.menuType, menuType),
    eq(challengeResults.leaderboardKey, leaderboardKey),
    gte(challengeResults.createdAt, periodStart),
  );
}

// ---------------------------------------------------------------------------
// All-time ranking (from challenge_best_scores)
// ---------------------------------------------------------------------------

/**
 * 全期間ランキングの母集団を絞る条件
 * 全期間ランキング母集団
 *
 * profiles との結合を前提に、対象の練習・セグメントかつランキング非表示で
 * ないものへ絞る。一覧と件数で同じものを使う。
 */
function allTimeWhere(menuType: string, leaderboardKey: string) {
  return and(
    eq(challengeBestScores.menuType, menuType),
    eq(challengeBestScores.leaderboardKey, leaderboardKey),
    notHiddenFromLeaderboard(),
  );
}

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
    .where(allTimeWhere(menuType, leaderboardKey))
    .orderBy(...rankingOrder(challengeBestScores))
    .offset(offset)
    .limit(limit);

  // 件数側も profiles を結合する。ランキング非表示の絞り込みが一覧にしか
  // 効いていないと total が実際の行数より多くなり、末尾に空ページができる。
  const [countRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(challengeBestScores)
    .innerJoin(profiles, eq(challengeBestScores.userId, profiles.id))
    .where(allTimeWhere(menuType, leaderboardKey));

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
    .where(periodResultsWhere(menuType, leaderboardKey, periodStart))
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
    .where(notHiddenFromLeaderboard())
    .orderBy(...rankingOrder(bestPerUser))
    .offset(offset)
    .limit(limit);

  // 件数側も同じ結合と絞り込みを通す（`getAllTimeRanking` と同じ理由）。
  const [countRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(bestPerUser)
    .innerJoin(profiles, eq(bestPerUser.userId, profiles.id))
    .where(notHiddenFromLeaderboard());

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
    startOfCurrentMonth(new Date()),
    offset,
    limit,
  );
}
