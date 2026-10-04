"use server";

import { getOptionalUser } from "@/lib/auth";
import {
  buildJourney,
  countProgress,
  type JourneyStageProgress,
} from "@mahjong-scoring/features/journey/journey";
import { isRankSlug } from "@mahjong-scoring/features/ranks/registry";

import { fetchJourneyInput } from "../_lib/journey-input";

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

  const journey = buildJourney(await fetchJourneyInput(user.id)).ranks.find(
    (rank) => rank.rank.slug === rankSlug,
  );
  if (journey === undefined) return undefined;

  return {
    learn: countProgress(journey.chapters),
    practice: countProgress(journey.practices),
    examPassed: journey.exam.done,
  };
}
