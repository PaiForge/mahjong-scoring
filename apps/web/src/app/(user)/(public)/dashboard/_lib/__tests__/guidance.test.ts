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
  describe("行程が進行中（取る級が残っている）", () => {
    it("新規ユーザー: 次の一歩は最初のレッスン、教本は補助リンクだけで「教本の続き」は出さない", () => {
      const guidance = selectDashboardGuidance({
        readSlugs: NONE,
        completedLessonSlugs: NONE,
        attemptedPractices: NO_ATTEMPTS,
        achievedRankSlugs: NO_RANKS,
      });

      expect(guidance.journey.isFresh).toBe(true);
      expect(guidance.journey.nextStep?.kind).toBe("lesson");
      expect(guidance.showTextbookLink).toBe(true);
      expect(guidance.nextChapter).toBeUndefined();
      expect(guidance.showComprehensivePractice).toBe(false);
    });

    it("継続ユーザー: 読みかけの章があっても、行程の次の一歩と別の再開先は出さない", () => {
      const guidance = selectDashboardGuidance({
        readSlugs: new Set(["about-this-app", "why-scoring-is-complex"]),
        completedLessonSlugs: new Set(["mangan-ko-ron"]),
        attemptedPractices: NO_ATTEMPTS,
        achievedRankSlugs: NO_RANKS,
      });

      expect(guidance.journey.nextStep).toEqual({
        kind: "lesson",
        lessonSlug: "mangan-ko-tsumo",
        chapterSlug: "mangan-ko-tsumo",
      });
      expect(guidance.showTextbookLink).toBe(true);
      expect(guidance.nextChapter).toBeUndefined();
    });

    it("全章読了でも、取る級が残っているなら総合演習に譲らない", () => {
      const guidance = selectDashboardGuidance({
        readSlugs: new Set(CURRICULUM_CHAPTER_SLUGS),
        completedLessonSlugs: NONE,
        attemptedPractices: NO_ATTEMPTS,
        achievedRankSlugs: NO_RANKS,
      });

      expect(guidance.journey.nextStep?.kind).toBe("practice");
      expect(guidance.showComprehensivePractice).toBe(false);
    });
  });

  describe("全級取得済み", () => {
    it("未学習の章が残っているなら教本の続きを出し、総合演習も出す", () => {
      const guidance = selectDashboardGuidance({
        readSlugs: new Set(["about-this-app"]),
        completedLessonSlugs: NONE,
        attemptedPractices: NO_ATTEMPTS,
        achievedRankSlugs: RANK_SLUGS,
      });

      expect(guidance.journey.nextStep).toBeUndefined();
      expect(guidance.showTextbookLink).toBe(false);
      expect(guidance.nextChapter?.slug).toBe("why-scoring-is-complex");
      expect(guidance.showComprehensivePractice).toBe(true);
    });

    it("レッスンで学んだ章は読んでいなくても飛ばし、その次の章を勧める", () => {
      const guidance = selectDashboardGuidance({
        readSlugs: new Set(["about-this-app", "why-scoring-is-complex"]),
        completedLessonSlugs: new Set(["mangan-ko-ron"]),
        attemptedPractices: NO_ATTEMPTS,
        achievedRankSlugs: RANK_SLUGS,
      });

      expect(guidance.nextChapter?.slug).toBe("mangan-ko-tsumo");
    });

    it("全章学習済みなら教本の続きは無く、総合演習だけを勧める", () => {
      const guidance = selectDashboardGuidance({
        readSlugs: new Set(CURRICULUM_CHAPTER_SLUGS),
        completedLessonSlugs: NONE,
        attemptedPractices: NO_ATTEMPTS,
        achievedRankSlugs: RANK_SLUGS,
      });

      expect(guidance.nextChapter).toBeUndefined();
      expect(guidance.showTextbookLink).toBe(false);
      expect(guidance.showComprehensivePractice).toBe(true);
    });
  });
});
