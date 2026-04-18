/**
 * チャレンジ結果クエリ
 *
 * マイページのチャレンジ履歴で使用するデータ取得関数群。
 * Server Action からもサーバーコンポーネントからも呼び出せるプレーン関数。
 */

import { and, count, desc, eq, gte, lt } from "drizzle-orm";

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

/**
 * Drizzle の行データを ChallengeSession に変換する
 * セッション行変換
 */
function toChallengeSession(row: {
  id: string;
  menuType: string;
  score: number;
  incorrectAnswers: number;
  createdAt: Date;
}): ChallengeSession | undefined {
  if (!isPracticeMenuType(row.menuType)) return undefined;
  return {
    id: row.id,
    menuType: row.menuType,
    score: row.score,
    incorrectAnswers: row.incorrectAnswers,
    createdAt: row.createdAt,
  };
}

/**
 * 指定範囲のチャレンジセッションを取得するヘルパー
 * セッション範囲取得
 */
async function querySessionsByRange(
  userId: string,
  menuType: string,
  range: { start: Date; end: Date },
): Promise<ChallengeSession[]> {
  const rows = await db
    .select({
      id: challengeResults.id,
      menuType: challengeResults.menuType,
      score: challengeResults.score,
      incorrectAnswers: challengeResults.incorrectAnswers,
      createdAt: challengeResults.createdAt,
    })
    .from(challengeResults)
    .where(
      and(
        eq(challengeResults.userId, userId),
        eq(challengeResults.menuType, menuType),
        gte(challengeResults.createdAt, range.start),
        lt(challengeResults.createdAt, range.end),
      ),
    )
    .orderBy(desc(challengeResults.createdAt));

  return rows.flatMap((row) => {
    const session = toChallengeSession(row);
    return session ? [session] : [];
  });
}

/**
 * 指定メニュー・期間のチャレンジセッション一覧を取得する
 * チャレンジセッション取得
 */
export async function fetchChallengeSessions(
  userId: string,
  menuType: PracticeMenuType,
  currentRangeStart: Date,
  currentRangeEnd: Date,
  previousRangeStart: Date,
  previousRangeEnd: Date,
): Promise<{
  current: ChallengeSession[];
  previous: ChallengeSession[];
}> {
  const currentRange = { start: currentRangeStart, end: currentRangeEnd };
  const previousRange = { start: previousRangeStart, end: previousRangeEnd };

  const [currentRows, previousRows] = await Promise.all([
    querySessionsByRange(userId, menuType, currentRange),
    querySessionsByRange(userId, menuType, previousRange),
  ]);

  return {
    current: currentRows,
    previous: previousRows,
  };
}

/**
 * ユーザーが記録を持つメニュー種別の一覧を返す
 * 利用可能メニュー取得
 */
export async function fetchAvailableMenuTypes(
  userId: string,
): Promise<PracticeMenuType[]> {
  const rows = await db
    .selectDistinct({ menuType: challengeResults.menuType })
    .from(challengeResults)
    .where(eq(challengeResults.userId, userId));

  return rows
    .map((r) => r.menuType)
    .filter((m): m is PracticeMenuType => isPracticeMenuType(m));
}
