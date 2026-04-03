"use server";

import { and, desc, eq, gte, lt } from "drizzle-orm";

import { db } from "@/lib/db";
import type { PracticeMenuType } from "@/lib/db/practice-menu-types";
import { isPracticeMenuType } from "@/lib/db/practice-menu-types";
import { challengeResults } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";

import type { ChallengeSession } from "../_lib/types";

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
 * チャレンジセッション取得アクション
 */
export async function getChallengeSessions(
  menuType: PracticeMenuType,
  currentRangeStart: Date,
  currentRangeEnd: Date,
  previousRangeStart: Date,
  previousRangeEnd: Date,
): Promise<{
  current: ChallengeSession[];
  previous: ChallengeSession[];
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { current: [], previous: [] };
    }

    const currentRange = { start: currentRangeStart, end: currentRangeEnd };
    const previousRange = { start: previousRangeStart, end: previousRangeEnd };

    const [currentRows, previousRows] = await Promise.all([
      querySessionsByRange(user.id, menuType, currentRange),
      querySessionsByRange(user.id, menuType, previousRange),
    ]);

    return {
      current: currentRows,
      previous: previousRows,
    };
  } catch (error) {
    console.error("Failed to fetch challenge sessions:", error);
    return { current: [], previous: [] };
  }
}

/**
 * ユーザーが記録を持つメニュー種別の一覧を返す
 * 利用可能メニュー取得アクション
 */
export async function getAvailableMenuTypes(): Promise<PracticeMenuType[]> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return [];

    const rows = await db
      .selectDistinct({ menuType: challengeResults.menuType })
      .from(challengeResults)
      .where(eq(challengeResults.userId, user.id));

    return rows
      .map((r) => r.menuType)
      .filter((m): m is PracticeMenuType => isPracticeMenuType(m));
  } catch {
    return [];
  }
}
