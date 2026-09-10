/**
 * チャレンジ結果クエリ
 *
 * マイページのチャレンジ履歴で使用するデータ取得関数群。
 * Server Action からもサーバーコンポーネントからも呼び出せるプレーン関数。
 */

import { and, count, desc, eq, gte, lt, notInArray } from "drizzle-orm";

import { db } from "@/lib/db";
import { DEFAULT_PAGE_SIZE, getPaginationData } from "@/lib/pagination";
import {
  isPracticeMenuType,
  isPracticeVariant,
} from "@/lib/db/practice-menu-types";
import { challengeResults } from "@/lib/db/schema";

import { EXCLUDED_MENU_TYPES, toRecordBoards } from "./menu-scope";
import type { ChallengeAttempt, RecordBoard } from "./types";

/**
 * ページネーション付きでチャレンジ結果を取得する
 * チャレンジ結果ページネーション取得
 */
export async function getChallengeResultsPaginated(
  userId: string,
  page: number = 1,
  board?: RecordBoard,
): Promise<{ items: ChallengeAttempt[]; totalPages: number }> {
  const conditions = [
    eq(challengeResults.userId, userId),
    notInArray(challengeResults.menuType, EXCLUDED_MENU_TYPES),
  ];
  if (board) {
    conditions.push(
      eq(challengeResults.menuType, board.menuType),
      eq(challengeResults.leaderboardKey, board.variant),
    );
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
        leaderboardKey: challengeResults.leaderboardKey,
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
 *
 * menu_type / leaderboard_key は varchar なので、レジストリから外れた過去の
 * 値（消した練習・消したバリアント）は読み飛ばす。
 */
function toChallengeAttempt(row: {
  id: string;
  menuType: string;
  leaderboardKey: string;
  score: number;
  incorrectAnswers: number;
  createdAt: Date;
}): ChallengeAttempt | undefined {
  if (!isPracticeMenuType(row.menuType)) return undefined;
  if (!isPracticeVariant(row.menuType, row.leaderboardKey)) return undefined;
  return {
    id: row.id,
    menuType: row.menuType,
    variant: row.leaderboardKey,
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
  board: RecordBoard,
  range: { start: Date; end: Date },
): Promise<ChallengeAttempt[]> {
  const rows = await db
    .select({
      id: challengeResults.id,
      menuType: challengeResults.menuType,
      leaderboardKey: challengeResults.leaderboardKey,
      score: challengeResults.score,
      incorrectAnswers: challengeResults.incorrectAnswers,
      createdAt: challengeResults.createdAt,
    })
    .from(challengeResults)
    .where(
      and(
        eq(challengeResults.userId, userId),
        eq(challengeResults.menuType, board.menuType),
        eq(challengeResults.leaderboardKey, board.variant),
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
 * 指定した土俵・期間のチャレンジ一覧を取得する
 * チャレンジ取得
 */
export async function fetchChallengeAttempts(
  userId: string,
  board: RecordBoard,
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
    queryAttemptsByRange(userId, board, currentRange),
    queryAttemptsByRange(userId, board, previousRange),
  ]);

  return {
    current: currentRows,
    previous: previousRows,
  };
}

/**
 * ユーザーが記録を持つ土俵（練習種別 × バリアント）の一覧を返す
 * 利用可能土俵取得
 *
 * 行の検証と並び順（練習一覧と同じ）は `toRecordBoards` が決める。
 */
export async function fetchAvailableBoards(
  userId: string,
): Promise<RecordBoard[]> {
  const rows = await db
    .selectDistinct({
      menuType: challengeResults.menuType,
      leaderboardKey: challengeResults.leaderboardKey,
    })
    .from(challengeResults)
    .where(
      and(
        eq(challengeResults.userId, userId),
        notInArray(challengeResults.menuType, EXCLUDED_MENU_TYPES),
      ),
    );

  return toRecordBoards(rows);
}
