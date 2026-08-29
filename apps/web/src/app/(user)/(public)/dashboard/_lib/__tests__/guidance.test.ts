import { describe, expect, it } from "vitest";

import {
  CURRICULUM,
  CURRICULUM_CHAPTER_SLUGS,
} from "@/app/(user)/(public)/learn/_lib/curriculum";
import { practiceSlugFromHref } from "@/app/(user)/(public)/practice/_lib/practice-catalog";
import type { PracticeMenuSlug } from "@/lib/db/practice-menu-types";
import { RANK_REGISTRY, RANK_SLUGS, type RankSlug } from "@/lib/ranks/registry";

import { selectDashboardGuidance } from "../guidance";

const NO_ATTEMPTS: ReadonlySet<PracticeMenuSlug> = new Set();
const NO_RANKS: readonly RankSlug[] = [];
const ALL_RANKS: readonly RankSlug[] = RANK_SLUGS;

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
      achievedRankSlugs: NO_RANKS,
    });

    expect(guidance.nextChapter?.slug).toBe("about-this-app");
    expect(guidance.recommendedPracticeSlugs).toEqual([]);
    expect(guidance.showComprehensivePractice).toBe(false);
  });

  it("読了済み章に対応する未挑戦の練習を勧める", () => {
    const guidance = selectDashboardGuidance({
      readSlugs: new Set(["about-this-app", "jantou-fu"]),
      attemptedSlugs: NO_ATTEMPTS,
      achievedRankSlugs: NO_RANKS,
    });

    expect(guidance.recommendedPracticeSlugs).toEqual(["jantou-fu"]);
  });

  it("まだ読んでいない章の練習は勧めない", () => {
    const guidance = selectDashboardGuidance({
      readSlugs: new Set(["jantou-fu"]),
      attemptedSlugs: NO_ATTEMPTS,
      achievedRankSlugs: NO_RANKS,
    });

    // mentsu-fu は未読なので、その練習は出てこない
    expect(guidance.recommendedPracticeSlugs).not.toContain("mentsu-fu");
  });

  it("挑戦済みの練習は勧めない", () => {
    const guidance = selectDashboardGuidance({
      readSlugs: new Set(["jantou-fu", "mentsu-fu"]),
      attemptedSlugs: new Set<PracticeMenuSlug>(["jantou-fu"]),
      achievedRankSlugs: NO_RANKS,
    });

    expect(guidance.recommendedPracticeSlugs).toEqual(["mentsu-fu"]);
  });

  it("勧める練習は 2 件までに絞る", () => {
    const guidance = selectDashboardGuidance({
      readSlugs: new Set(CURRICULUM_CHAPTER_SLUGS),
      attemptedSlugs: NO_ATTEMPTS,
      achievedRankSlugs: NO_RANKS,
    });

    expect(guidance.recommendedPracticeSlugs).toHaveLength(2);
  });

  it("同じ練習を複数の章が参照していても 1 度しか勧めない", () => {
    // tehai-fu の章は jantou-fu / mentsu-fu / machi-fu の練習も参照している
    const guidance = selectDashboardGuidance({
      readSlugs: new Set(["jantou-fu", "tehai-fu"]),
      attemptedSlugs: NO_ATTEMPTS,
      achievedRankSlugs: NO_RANKS,
    });

    const slugs = guidance.recommendedPracticeSlugs;
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("カリキュラム順（読んだ順序）で勧める", () => {
    const guidance = selectDashboardGuidance({
      readSlugs: new Set(["machi-fu", "jantou-fu", "mentsu-fu"]),
      attemptedSlugs: NO_ATTEMPTS,
      achievedRankSlugs: NO_RANKS,
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
      achievedRankSlugs: NO_RANKS,
    });

    expect(guidance.nextChapter).toBeUndefined();
  });

  it("全章読了・全練習挑戦済みで、取る段級位も残っていなければ総合演習を勧める", () => {
    const guidance = selectDashboardGuidance({
      readSlugs: new Set(CURRICULUM_CHAPTER_SLUGS),
      attemptedSlugs: ALL_PRACTICE_SLUGS,
      achievedRankSlugs: ALL_RANKS,
    });

    expect(guidance.nextChapter).toBeUndefined();
    expect(guidance.recommendedPracticeSlugs).toEqual([]);
    expect(guidance.readyExamSlugs).toEqual([]);
    expect(guidance.showComprehensivePractice).toBe(true);
  });

  it("受験できる試験があるうちは総合演習に譲らない", () => {
    // 全章読了・全練習挑戦済みでも、まだ取れる段級位が残っているなら
    // 「次にやること」は総合演習ではなく受験
    const guidance = selectDashboardGuidance({
      readSlugs: new Set(CURRICULUM_CHAPTER_SLUGS),
      attemptedSlugs: ALL_PRACTICE_SLUGS,
      achievedRankSlugs: NO_RANKS,
    });

    expect(guidance.readyExamSlugs).toEqual(["mangan-exam"]);
    expect(guidance.showComprehensivePractice).toBe(false);
  });
});

describe("selectDashboardGuidance: 昇級試験", () => {
  /** 5級の前提章（満貫セクション 4 章 + 役の章） */
  const KYU5_CHAPTERS = RANK_REGISTRY[0].learnChapterSlugs;

  it("前提章をすべて読み終えたら受験できる試験を返す", () => {
    const guidance = selectDashboardGuidance({
      readSlugs: new Set(KYU5_CHAPTERS),
      attemptedSlugs: NO_ATTEMPTS,
      achievedRankSlugs: NO_RANKS,
    });

    expect(guidance.readyExamSlugs).toEqual(["mangan-exam"]);
  });

  it("前提章が 1 つでも残っていれば返さない", () => {
    const guidance = selectDashboardGuidance({
      readSlugs: new Set(KYU5_CHAPTERS.slice(0, -1)),
      attemptedSlugs: NO_ATTEMPTS,
      achievedRankSlugs: NO_RANKS,
    });

    expect(guidance.readyExamSlugs).toEqual([]);
  });

  it("読了 0 件では返さない（最初の行動に落ちる試験を勧めない）", () => {
    const guidance = selectDashboardGuidance({
      readSlugs: new Set(),
      attemptedSlugs: NO_ATTEMPTS,
      achievedRankSlugs: NO_RANKS,
    });

    expect(guidance.readyExamSlugs).toEqual([]);
  });

  it("取得済みの段級位の試験は返さない", () => {
    const guidance = selectDashboardGuidance({
      readSlugs: new Set(CURRICULUM_CHAPTER_SLUGS),
      attemptedSlugs: NO_ATTEMPTS,
      achievedRankSlugs: ALL_RANKS,
    });

    expect(guidance.readyExamSlugs).toEqual([]);
  });

  it("練習の挑戦履歴は条件にしない", () => {
    const guidance = selectDashboardGuidance({
      readSlugs: new Set(KYU5_CHAPTERS),
      attemptedSlugs: NO_ATTEMPTS,
      achievedRankSlugs: NO_RANKS,
    });

    expect(guidance.readyExamSlugs).toEqual(["mangan-exam"]);
  });

  it("未読の章が残っているうちは総合演習を出さない", () => {
    const guidance = selectDashboardGuidance({
      readSlugs: new Set(["jantou-fu"]),
      attemptedSlugs: ALL_PRACTICE_SLUGS,
      achievedRankSlugs: NO_RANKS,
    });

    expect(guidance.nextChapter).toBeDefined();
    expect(guidance.recommendedPracticeSlugs).toEqual([]);
    expect(guidance.showComprehensivePractice).toBe(false);
  });
});
