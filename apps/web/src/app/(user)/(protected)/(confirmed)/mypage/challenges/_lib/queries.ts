/**
 * ページネーション付きチャレンジ結果クエリ
 *
 * マイページのチャレンジ履歴一覧で使用する。
 */

import { and, count, desc, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import type { PracticeMenuType } from "@/lib/db/practice-menu-types";
import { isPracticeMenuType } from "@/lib/db/practice-menu-types";
import { challengeResults } from "@/lib/db/schema";

import type { ChallengeSession } from "./types";

const PAGE_SIZE = 20;

/**
 * ページネーション付きでチャレンジ結果を取得する
 * チャレンジ結果ページネーション取得
 */
export async function getChallengeResultsPaginated(
  userId: string,
  page: number = 1,
  menuType?: PracticeMenuType,
): Promise<{ items: ChallengeSession[]; totalPages: number }> {
  const conditions = [eq(challengeResults.userId, userId)];
  if (menuType) {
    conditions.push(eq(challengeResults.menuType, menuType));
  }

  const whereClause = and(...conditions);

  const safePage = Math.max(1, page);
  const offset = (safePage - 1) * PAGE_SIZE;

  const [countResult, rows] = await Promise.all([
    db
      .select({ count: count() })
      .from(challengeResults)
      .where(whereClause)
      .then(([result]) => result),
    db
      .select({
        id: challengeResults.id,
        menuType: challengeResults.menuType,
        score: challengeResults.score,
        incorrectAnswers: challengeResults.incorrectAnswers,
        createdAt: challengeResults.createdAt,
      })
      .from(challengeResults)
      .where(whereClause)
      .orderBy(desc(challengeResults.createdAt))
      .limit(PAGE_SIZE)
      .offset(offset),
  ]);

  const totalCount = countResult.count;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const items = rows.flatMap((row) => {
    if (!isPracticeMenuType(row.menuType)) return [];
    const session: ChallengeSession = {
      id: row.id,
      menuType: row.menuType,
      score: row.score,
      incorrectAnswers: row.incorrectAnswers,
      createdAt: row.createdAt,
    };
    return [session];
  });

  return { items, totalPages };
}
