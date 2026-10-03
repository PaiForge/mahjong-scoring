import { describe, expect, it } from "vitest";

import { CURRICULUM_CHAPTER_SLUGS } from "@mahjong-scoring/features/curriculum/registry";
import type { PracticeAttempt } from "@mahjong-scoring/features/journey/journey";
import {
  RANK_SLUGS,
  type RankSlug,
} from "@mahjong-scoring/features/ranks/registry";

import { selectDashboardGuidance } from "../guidance";

const NONE: ReadonlySet<string> = new Set();
const NO_ATTEMPTS: readonly PracticeAttempt[] = [];
const NO_RANKS: readonly RankSlug[] = [];

describe("selectDashboardGuidance", () => {
  it("何も始めていなければ、次の一歩は最初のレッスンで、次の章は最初の章", () => {
    const guidance = selectDashboardGuidance({
      readSlugs: NONE,
      completedLessonSlugs: NONE,
      attemptedPractices: NO_ATTEMPTS,
      achievedRankSlugs: NO_RANKS,
    });

    expect(guidance.journey.isFresh).toBe(true);
    expect(guidance.journey.nextStep?.kind).toBe("lesson");
    expect(guidance.nextChapter?.slug).toBe("about-this-app");
    expect(guidance.showComprehensivePractice).toBe(false);
  });

  it("全章読了でも、取る段級位が残っているなら総合演習に譲らない", () => {
    const guidance = selectDashboardGuidance({
      readSlugs: new Set(CURRICULUM_CHAPTER_SLUGS),
      completedLessonSlugs: NONE,
      attemptedPractices: NO_ATTEMPTS,
      achievedRankSlugs: NO_RANKS,
    });

    expect(guidance.nextChapter).toBeUndefined();
    expect(guidance.journey.nextStep?.kind).toBe("practice");
    expect(guidance.showComprehensivePractice).toBe(false);
  });

  it("全級取得済みでも、未読の章が残っているなら教本の続きを出し、総合演習は出さない", () => {
    const guidance = selectDashboardGuidance({
      readSlugs: new Set(["about-this-app"]),
      completedLessonSlugs: NONE,
      attemptedPractices: NO_ATTEMPTS,
      achievedRankSlugs: RANK_SLUGS,
    });

    expect(guidance.journey.nextStep).toBeUndefined();
    expect(guidance.nextChapter?.slug).toBe("why-scoring-is-complex");
    expect(guidance.showComprehensivePractice).toBe(false);
  });

  it("全級取得・全章読了なら総合演習を勧める", () => {
    const guidance = selectDashboardGuidance({
      readSlugs: new Set(CURRICULUM_CHAPTER_SLUGS),
      completedLessonSlugs: NONE,
      attemptedPractices: NO_ATTEMPTS,
      achievedRankSlugs: RANK_SLUGS,
    });

    expect(guidance.journey.nextStep).toBeUndefined();
    expect(guidance.nextChapter).toBeUndefined();
    expect(guidance.showComprehensivePractice).toBe(true);
  });
});
