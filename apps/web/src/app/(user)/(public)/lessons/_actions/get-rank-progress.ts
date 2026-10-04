"use server";

import { fetchAttemptedPractices } from "@/app/(user)/(public)/dashboard/_lib/attempted-practices";
import { fetchReadChapterSlugs } from "@/app/(user)/(public)/learn/_lib/progress";
import { getOptionalUser } from "@/lib/auth";
import { getUserRankSlugs } from "@/lib/db/rank-queries";
import {
  buildJourney,
  countProgress,
  type JourneyStageProgress,
} from "@mahjong-scoring/features/journey/journey";
import { isRankSlug } from "@mahjong-scoring/features/ranks/registry";

import { fetchCompletedLessonSlugs } from "../_lib/progress";

/** 1 つの級の行程の進み具合（段ごとの済んだ数と全体、試験の合否） */
export interface RankProgress {
  readonly learn: JourneyStageProgress;
  readonly practice: JourneyStageProgress;
  readonly examPassed: boolean;
}

/**
 * 1 つの級の行程の進み具合を返す Server Action
 * 級の進み具合取得
 *
 * 級の最後のレッスンの完了画面が「昇級試験まで」の進み具合を出すのに使う。
 * レッスンのページは静的生成なので、完了状態（`getLessonCompletionState`）と
 * 同じくクライアントがマウント後に呼ぶ。数え方は道場の行程カードと同じ
 * （features の `buildJourney`）。未認証・不正な slug は undefined。
 *
 * @param rankSlug 対象の段級位スラッグ
 */
export async function getRankProgress(
  rankSlug: string,
): Promise<RankProgress | undefined> {
  if (!isRankSlug(rankSlug)) return undefined;
  const user = await getOptionalUser();
  if (!user) return undefined;

  const [
    achievedRankSlugs,
    readSlugs,
    completedLessonSlugs,
    attemptedPractices,
  ] = await Promise.all([
    getUserRankSlugs(user.id),
    fetchReadChapterSlugs(),
    fetchCompletedLessonSlugs(),
    fetchAttemptedPractices(),
  ]);
  const journey = buildJourney({
    readSlugs,
    completedLessonSlugs,
    attemptedPractices,
    achievedRankSlugs,
  }).ranks.find((rank) => rank.rank.slug === rankSlug);
  if (journey === undefined) return undefined;

  return {
    learn: countProgress(journey.chapters),
    practice: countProgress(journey.practices),
    examPassed: journey.exam.done,
  };
}
