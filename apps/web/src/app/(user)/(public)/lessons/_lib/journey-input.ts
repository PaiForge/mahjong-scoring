import "server-only";

import { fetchAttemptedPractices } from "@/app/(user)/(public)/dashboard/_lib/attempted-practices";
import { fetchReadChapterSlugs } from "@/app/(user)/(public)/learn/_lib/progress";
import { getUserRankSlugs } from "@/lib/db/rank-queries";
import type { BuildJourneyInput } from "@mahjong-scoring/features/journey/journey";

import { fetchCompletedLessonSlugs } from "./progress";

/**
 * 本人の黒帯への道の進み具合（`buildJourney` の入力）を集める
 * 行程の入力取得
 *
 * 道場・ダッシュボードと同じ 4 つ（取得済みの級・読了・レッスンの完了・
 * 挑戦した練習）。レッスンの完了画面が、昇級試験までの進み具合と
 * 進み具合を踏まえた次の一歩を出すのに使う。
 *
 * @param userId 認証済みユーザーの id（取得済みの級を引くのに使う。
 *   他の 3 つは各取得関数がセッションから本人を引く）
 */
export async function fetchJourneyInput(
  userId: string,
): Promise<BuildJourneyInput> {
  const [
    achievedRankSlugs,
    readSlugs,
    completedLessonSlugs,
    attemptedPractices,
  ] = await Promise.all([
    getUserRankSlugs(userId),
    fetchReadChapterSlugs(),
    fetchCompletedLessonSlugs(),
    fetchAttemptedPractices(),
  ]);
  return {
    achievedRankSlugs,
    readSlugs,
    completedLessonSlugs,
    attemptedPractices,
  };
}
