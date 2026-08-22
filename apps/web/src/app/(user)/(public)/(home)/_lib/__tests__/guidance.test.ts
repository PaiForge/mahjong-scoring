import { describe, expect, it } from "vitest";

import {
  CURRICULUM,
  CURRICULUM_CHAPTER_SLUGS,
} from "@/app/(user)/(public)/learn/_lib/curriculum";
import { practiceSlugFromHref } from "@/app/(user)/(public)/practice/_lib/practice-catalog";
import type { PracticeMenuSlug } from "@/lib/db/practice-menu-types";

import { selectDashboardGuidance } from "../guidance";

const NO_ATTEMPTS: ReadonlySet<PracticeMenuSlug> = new Set();

/** 全章の practiceHrefs から解決できる練習スラッグ（重複なし） */
const ALL_PRACTICE_SLUGS: ReadonlySet<PracticeMenuSlug> = new Set(
  CURRICULUM.flatMap((chapter) => chapter.practiceHrefs ?? [])
    .map((href) => practiceSlugFromHref(href))
    .filter((slug) => slug !== undefined),
);

describe("selectDashboardGuidance", () => {
  it("読了 0 件なら最初の章を次の章にし、練習は勧めない", () => {
    const guidance = selectDashboardGuidance({
      readSlugs: new Set(),
      attemptedSlugs: NO_ATTEMPTS,
    });

    expect(guidance.nextChapter?.slug).toBe("about-this-app");
    expect(guidance.recommendedPracticeSlugs).toEqual([]);
    expect(guidance.showComprehensivePractice).toBe(false);
  });

  it("読了済み章に対応する未挑戦の練習を勧める", () => {
    const guidance = selectDashboardGuidance({
      readSlugs: new Set(["about-this-app", "jantou-fu"]),
      attemptedSlugs: NO_ATTEMPTS,
    });

    expect(guidance.recommendedPracticeSlugs).toEqual(["jantou-fu"]);
  });

  it("まだ読んでいない章の練習は勧めない", () => {
    const guidance = selectDashboardGuidance({
      readSlugs: new Set(["jantou-fu"]),
      attemptedSlugs: NO_ATTEMPTS,
    });

    // mentsu-fu は未読なので、その練習は出てこない
    expect(guidance.recommendedPracticeSlugs).not.toContain("mentsu-fu");
  });

  it("挑戦済みの練習は勧めない", () => {
    const guidance = selectDashboardGuidance({
      readSlugs: new Set(["jantou-fu", "mentsu-fu"]),
      attemptedSlugs: new Set<PracticeMenuSlug>(["jantou-fu"]),
    });

    expect(guidance.recommendedPracticeSlugs).toEqual(["mentsu-fu"]);
  });

  it("勧める練習は 2 件までに絞る", () => {
    const guidance = selectDashboardGuidance({
      readSlugs: new Set(CURRICULUM_CHAPTER_SLUGS),
      attemptedSlugs: NO_ATTEMPTS,
    });

    expect(guidance.recommendedPracticeSlugs).toHaveLength(2);
  });

  it("同じ練習を複数の章が参照していても 1 度しか勧めない", () => {
    // tehai-fu の章は jantou-fu / mentsu-fu / machi-fu の練習も参照している
    const guidance = selectDashboardGuidance({
      readSlugs: new Set(["jantou-fu", "tehai-fu"]),
      attemptedSlugs: NO_ATTEMPTS,
    });

    const slugs = guidance.recommendedPracticeSlugs;
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("カリキュラム順（読んだ順序）で勧める", () => {
    const guidance = selectDashboardGuidance({
      readSlugs: new Set(["machi-fu", "jantou-fu", "mentsu-fu"]),
      attemptedSlugs: NO_ATTEMPTS,
    });

    // order は jantou-fu(30) → mentsu-fu(40) → machi-fu(50)
    expect(guidance.recommendedPracticeSlugs).toEqual([
      "jantou-fu",
      "mentsu-fu",
    ]);
  });

  it("全章読了なら次の章は無い", () => {
    const guidance = selectDashboardGuidance({
      readSlugs: new Set(CURRICULUM_CHAPTER_SLUGS),
      attemptedSlugs: NO_ATTEMPTS,
    });

    expect(guidance.nextChapter).toBeUndefined();
  });

  it("全章読了かつ全練習挑戦済みなら総合演習を勧める", () => {
    const guidance = selectDashboardGuidance({
      readSlugs: new Set(CURRICULUM_CHAPTER_SLUGS),
      attemptedSlugs: ALL_PRACTICE_SLUGS,
    });

    expect(guidance.nextChapter).toBeUndefined();
    expect(guidance.recommendedPracticeSlugs).toEqual([]);
    expect(guidance.showComprehensivePractice).toBe(true);
  });

  it("未読の章が残っているうちは総合演習を出さない", () => {
    const guidance = selectDashboardGuidance({
      readSlugs: new Set(["jantou-fu"]),
      attemptedSlugs: ALL_PRACTICE_SLUGS,
    });

    expect(guidance.nextChapter).toBeDefined();
    expect(guidance.recommendedPracticeSlugs).toEqual([]);
    expect(guidance.showComprehensivePractice).toBe(false);
  });
});
