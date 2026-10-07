import { describe, expect, it } from "vitest";

import { CURRICULUM_CHAPTER_SLUGS } from "../curriculum/registry";
import type { PracticeAttempt } from "./journey";
import { RANK_SLUGS, type RankSlug } from "../ranks/registry";

import { selectDashboardGuidance } from "./dashboard-guidance";

const NONE: ReadonlySet<string> = new Set();
const NO_ATTEMPTS: readonly PracticeAttempt[] = [];
const NO_RANKS: readonly RankSlug[] = [];

describe("selectDashboardGuidance", () => {
  describe("行程が進行中（取る級が残っている）", () => {
    it("新規ユーザー: 次の一歩は最初のレッスンだけで「レッスンの続き」は出さない", () => {
      const guidance = selectDashboardGuidance({
        completedLessonSlugs: NONE,
        attemptedPractices: NO_ATTEMPTS,
        achievedRankSlugs: NO_RANKS,
      });

      expect(guidance.journey.isFresh).toBe(true);
      expect(guidance.journey.nextStep?.kind).toBe("lesson");
      expect(guidance.nextChapter).toBeUndefined();
      expect(guidance.showComprehensivePractice).toBe(false);
    });

    it("継続ユーザー: 行程の外のレッスンを終えていても、行程の次の一歩と別の再開先は出さない", () => {
      const guidance = selectDashboardGuidance({
        completedLessonSlugs: new Set([
          "about-this-app",
          "why-scoring-is-complex",
          "mangan-ko-ron",
        ]),
        attemptedPractices: NO_ATTEMPTS,
        achievedRankSlugs: NO_RANKS,
      });

      expect(guidance.journey.nextStep).toEqual({
        kind: "lesson",
        chapterSlug: "mangan-ko-tsumo",
      });
      expect(guidance.nextChapter).toBeUndefined();
    });

    it("全レッスン完了でも、取る級が残っているなら総合演習に譲らない", () => {
      const guidance = selectDashboardGuidance({
        completedLessonSlugs: new Set(CURRICULUM_CHAPTER_SLUGS),
        attemptedPractices: NO_ATTEMPTS,
        achievedRankSlugs: NO_RANKS,
      });

      // 学ぶ段は済んでいるので、次の一歩は練習
      expect(guidance.journey.nextStep?.kind).toBe("practice");
      expect(guidance.showComprehensivePractice).toBe(false);
    });
  });

  describe("全級取得済み", () => {
    it("終えていないレッスンが残っているならレッスンの続きを出し、総合演習も出す", () => {
      const guidance = selectDashboardGuidance({
        completedLessonSlugs: new Set(["about-this-app"]),
        attemptedPractices: NO_ATTEMPTS,
        achievedRankSlugs: RANK_SLUGS,
      });

      expect(guidance.journey.nextStep).toBeUndefined();
      expect(guidance.nextChapter?.slug).toBe("why-scoring-is-complex");
      expect(guidance.showComprehensivePractice).toBe(true);
    });

    it("終えたレッスンは順序に関わらず飛ばし、最初の未完了を勧める", () => {
      const guidance = selectDashboardGuidance({
        completedLessonSlugs: new Set([
          "about-this-app",
          "why-scoring-is-complex",
          "mangan-ko-ron",
        ]),
        attemptedPractices: NO_ATTEMPTS,
        achievedRankSlugs: RANK_SLUGS,
      });

      expect(guidance.nextChapter?.slug).toBe("mangan-ko-tsumo");
    });

    it("全レッスン完了ならレッスンの続きは無く、総合演習だけを勧める", () => {
      const guidance = selectDashboardGuidance({
        completedLessonSlugs: new Set(CURRICULUM_CHAPTER_SLUGS),
        attemptedPractices: NO_ATTEMPTS,
        achievedRankSlugs: RANK_SLUGS,
      });

      expect(guidance.nextChapter).toBeUndefined();
      expect(guidance.showComprehensivePractice).toBe(true);
    });
  });
});
