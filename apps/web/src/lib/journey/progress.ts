import "server-only";

import { eq } from "drizzle-orm";

import type {
  BuildJourneyInput,
  PracticeAttempt,
} from "@mahjong-scoring/features/journey/journey";
import {
  isPracticeMenuType,
  menuTypeToSlug,
} from "@mahjong-scoring/features/practice-menu-types";

import { db } from "../db";
import { getUserRankSlugs } from "../db/rank-queries";
import { challengeBestScores, lessonCompletions } from "../db/schema";

/**
 * ユーザーが完了したレッスン（章）のスラッグ集合を返す
 * 完了レッスン取得
 *
 * web の画面は cookie のセッションから本人を引く版（`lessons/_lib/lesson-progress.ts`）を、
 * アプリ向け API はトークンで確かめた本人の id でこちらを呼ぶ。
 */
export async function getCompletedLessonSlugsOf(
  userId: string,
): Promise<ReadonlySet<string>> {
  const rows = await db
    .select({ lessonSlug: lessonCompletions.lessonSlug })
    .from(lessonCompletions)
    .where(eq(lessonCompletions.userId, userId));
  return new Set(rows.map((row) => row.lessonSlug));
}

/**
 * ユーザーが一度でも挑戦したことのある練習の土俵（slug × バリアント）を返す
 * 挑戦済み練習取得
 *
 * @remarks
 * `challenge_best_scores` は (userId, menuType, leaderboardKey) に 1 行なので、
 * 「その土俵をやったことがあるか」は追記ログ（`challenge_results`）を走査せずに
 * ここから引ける。`leaderboard_key` はバリアントのキーそのもの（設定を持たない
 * 練習は `default`）で、変換せずそのまま `variant` に載せる。
 *
 * `menu_type` はレジストリから外れた過去の値を読み飛ばすが、`leaderboard_key`
 * は外れていても落とさない。黒帯への道はそれを「範囲は分からないが挑戦は
 * した」として、バリアントを指定しない章のリンクだけに数える
 * （`PracticeAttempt` の TSDoc 参照）。
 */
export async function getAttemptedPracticesOf(
  userId: string,
): Promise<readonly PracticeAttempt[]> {
  const rows = await db
    .select({
      menuType: challengeBestScores.menuType,
      leaderboardKey: challengeBestScores.leaderboardKey,
    })
    .from(challengeBestScores)
    .where(eq(challengeBestScores.userId, userId));

  return rows.flatMap((row) =>
    isPracticeMenuType(row.menuType)
      ? [{ slug: menuTypeToSlug(row.menuType), variant: row.leaderboardKey }]
      : [],
  );
}

/**
 * ユーザーの黒帯への道の進み具合（`buildJourney` の入力）を集める
 * 行程の入力取得
 *
 * 道場・ダッシュボードと同じ 3 つ（取得済みの級・レッスンの完了・挑戦した練習）。
 */
export async function getJourneyInputOf(
  userId: string,
): Promise<BuildJourneyInput> {
  const [achievedRankSlugs, completedLessonSlugs, attemptedPractices] =
    await Promise.all([
      getUserRankSlugs(userId),
      getCompletedLessonSlugsOf(userId),
      getAttemptedPracticesOf(userId),
    ]);
  return { achievedRankSlugs, completedLessonSlugs, attemptedPractices };
}
