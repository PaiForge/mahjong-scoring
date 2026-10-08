import {
  buildJourney,
  countProgress,
  stepAfterLessonWithProgress,
  type BuildJourneyInput,
  type JourneyStageProgress,
  type JourneyStep,
} from "../journey/journey";
import { quizLessonBySlug, type QuizLessonSlug } from "./registry";
import type { PracticeLink } from "../curriculum/registry";

/**
 * 1 つの級の行程の進み具合（段ごとの済んだ数と全体、試験の合否）
 * 級の行程の進捗
 *
 * 5級から初段までのどこまで取ったかを示す段級位の進捗バー
 * （`ranks/rank-progress` の `RankProgress`）とは別物。
 */
export interface RankJourneyProgress {
  readonly learn: JourneyStageProgress;
  readonly practice: JourneyStageProgress;
  readonly examPassed: boolean;
}

/**
 * レッスンを記録した直後の本人に向けた続き
 * レッスンの続き
 *
 * - `next`: 進み具合を踏まえた次の一歩（features の `stepAfterLessonWithProgress`）。
 *   求められなければ無く、完了画面は道筋の順の一歩を使う
 * - `rankJourneyProgress`: レッスンの級の行程の進み具合（道場の行程カードと同じ数え方）。
 *   級の最後のレッスンの「昇級試験まで」が出す
 */
export interface LessonFollowUp {
  readonly next?: JourneyStep;
  readonly rankJourneyProgress?: RankJourneyProgress;
}

/**
 * 本人の進み具合から、終えたレッスンの続きを求める
 * レッスンの続きの算出
 *
 * 記録の Server Action が 1 回の読み取りから両方を返すためのもの（進み具合を
 * 次の一歩用と「昇級試験まで」用に 2 度読まない）。終えたレッスン自身は
 * 済みとして数える — 読み取りが記録より前でも、行程の数が揃う。
 */
export function lessonFollowUp(
  slug: QuizLessonSlug,
  input: BuildJourneyInput,
): LessonFollowUp {
  const progress: BuildJourneyInput = {
    ...input,
    completedLessonSlugs: new Set([...input.completedLessonSlugs, slug]),
  };
  const rankSlug = quizLessonBySlug(slug)?.rankSlug;
  const rank = buildJourney(progress).ranks.find(
    (journey) => journey.rank.slug === rankSlug,
  );
  return {
    next: stepAfterLessonWithProgress(slug, progress),
    rankJourneyProgress:
      rank === undefined
        ? undefined
        : {
            learn: countProgress(rank.chapters),
            practice: countProgress(rank.practices),
            examPassed: rank.exam.done,
          },
  };
}

/**
 * 練習リンクが次の一歩と同じ練習（同じ土俵）を指しているか
 * 次の一歩との一致
 *
 * 完了画面で同じ練習を「次にやること」と「関連する練習」に 2 度並べないために使う。
 * バリアントまで一致したものだけを同じとみなす（点数表早引きの子と親は別の練習）。
 */
export function isNextStepPractice(
  step: JourneyStep | undefined,
  link: PracticeLink,
): boolean {
  return (
    step?.kind === "practice" &&
    step.slug === link.slug &&
    step.variant === link.variant
  );
}
