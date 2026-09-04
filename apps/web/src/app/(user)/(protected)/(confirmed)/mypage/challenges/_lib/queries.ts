/**
 * チャレンジ結果クエリ
 *
 * マイページのチャレンジ履歴で使用するデータ取得関数群。
 * Server Action からもサーバーコンポーネントからも呼び出せるプレーン関数。
 */

import { and, count, desc, eq, gte, lt, notInArray } from "drizzle-orm";

import { db } from "@/lib/db";
import { DEFAULT_PAGE_SIZE, getPaginationData } from "@/lib/pagination";
import type { PracticeMenuType } from "@/lib/db/practice-menu-types";
import { isPracticeMenuType } from "@/lib/db/practice-menu-types";
import { challengeResults } from "@/lib/db/schema";

import { EXCLUDED_MENU_TYPES, isMyRecordMenuType } from "./menu-scope";
import type { ChallengeAttempt } from "./types";

/**
 * ページネーション付きでチャレンジ結果を取得する
 * チャレンジ結果ページネーション取得
 */
export async function getChallengeResultsPaginated(
  userId: string,
  page: number = 1,
  menuType?: PracticeMenuType,
): Promise<{ items: ChallengeAttempt[]; totalPages: number }> {
  const conditions = [
    eq(challengeResults.userId, userId),
    notInArray(challengeResults.menuType, EXCLUDED_MENU_TYPES),
  ];
  if (menuType) {
    conditions.push(eq(challengeResults.menuType, menuType));
  }

  const whereClause = and(...conditions);

  // 件数と行を並行して引くため、行の取得に必要な limit / offset だけ先に算出し、
  // 総ページ数は件数が揃ってから同じヘルパーで求める。
  const { limit, offset } = getPaginationData(page, 0, DEFAULT_PAGE_SIZE);

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
      .limit(limit)
      .offset(offset),
  ]);

  const { totalPages } = getPaginationData(
    page,
    countResult.count,
    DEFAULT_PAGE_SIZE,
  );

  const items = rows.flatMap((row) => {
    const attempt = toChallengeAttempt(row);
    return attempt ? [attempt] : [];
  });

  return { items, totalPages };
}

/**
 * Drizzle の行データを ChallengeAttempt に変換する
 * チャレンジ行変換
 */
function toChallengeAttempt(row: {
  id: string;
  menuType: string;
  score: number;
  incorrectAnswers: number;
  createdAt: Date;
}): ChallengeAttempt | undefined {
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
 * 指定範囲のチャレンジを取得するヘルパー
 * チャレンジ範囲取得
 */
async function queryAttemptsByRange(
  userId: string,
  menuType: string,
  range: { start: Date; end: Date },
): Promise<ChallengeAttempt[]> {
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
    const attempt = toChallengeAttempt(row);
    return attempt ? [attempt] : [];
  });
}

/**
 * 指定メニュー・期間のチャレンジ一覧を取得する
 * チャレンジ取得
 */
export async function fetchChallengeAttempts(
  userId: string,
  menuType: PracticeMenuType,
  currentRangeStart: Date,
  currentRangeEnd: Date,
  previousRangeStart: Date,
  previousRangeEnd: Date,
): Promise<{
  current: ChallengeAttempt[];
  previous: ChallengeAttempt[];
}> {
  const currentRange = { start: currentRangeStart, end: currentRangeEnd };
  const previousRange = { start: previousRangeStart, end: previousRangeEnd };

  const [currentRows, previousRows] = await Promise.all([
    queryAttemptsByRange(userId, menuType, currentRange),
    queryAttemptsByRange(userId, menuType, previousRange),
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
    .where(
      and(
        eq(challengeResults.userId, userId),
        notInArray(challengeResults.menuType, EXCLUDED_MENU_TYPES),
      ),
    );

  return rows
    .map((r) => r.menuType)
    .filter((m): m is PracticeMenuType => isMyRecordMenuType(m));
}
