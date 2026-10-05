import { describe, expect, it } from "vitest";

import { CURRICULUM_CHAPTER_SLUGS } from "../curriculum/registry";
import { practiceMenuFromCatalog } from "../practice/catalog";
import { isPracticeVariantOf } from "../practice-menu-types";
import { RANK_REGISTRY } from "../ranks/registry";
import {
  QUIZ_LESSON_REGISTRY,
  QUIZ_LESSON_SLUGS,
  isQuizLessonSlug,
  quizLessonBySlug,
} from "./registry";

describe("QUIZ_LESSON_REGISTRY", () => {
  it("slug が一意である（章ごとに確認問題は高々 1 つ）", () => {
    expect(new Set(QUIZ_LESSON_SLUGS).size).toBe(QUIZ_LESSON_SLUGS.length);
  });

  it("slug は実在する章で、その級の前提章に含まれる", () => {
    for (const lesson of QUIZ_LESSON_REGISTRY) {
      expect(CURRICULUM_CHAPTER_SLUGS).toContain(lesson.slug);
      const rank = RANK_REGISTRY.find(
        (entry) => entry.slug === lesson.rankSlug,
      );
      expect(rank?.learnChapterSlugs).toContain(lesson.slug);
    }
  });

  it("段級位の前提章はすべて確認問題を持つ", () => {
    for (const rank of RANK_REGISTRY) {
      for (const chapterSlug of rank.learnChapterSlugs) {
        expect(quizLessonBySlug(chapterSlug), chapterSlug).toBeDefined();
      }
    }
  });

  it("isQuizLessonSlug は確認問題を持つ章の slug だけを通す", () => {
    expect(isQuizLessonSlug("mangan-ko-ron")).toBe(true);
    expect(isQuizLessonSlug("fu-doubling")).toBe(false);
    expect(isQuizLessonSlug(undefined)).toBe(false);
  });

  it("slug から確認問題レッスンを引ける", () => {
    expect(quizLessonBySlug("mangan-ko-ron")?.rankSlug).toBe("kyu-5");
    expect(quizLessonBySlug("fu-doubling")).toBeUndefined();
    expect(quizLessonBySlug("unknown")).toBeUndefined();
  });

  it("練習リンクはカタログに載っている練習の正しいバリアントを指す", () => {
    for (const lesson of QUIZ_LESSON_REGISTRY) {
      for (const { slug, variant } of lesson.practiceLinks) {
        // カタログ外の練習へ送ると、一覧にもおすすめにも無い孤立した導線になる
        expect(practiceMenuFromCatalog(slug), lesson.slug).toBeDefined();
        // 不正なバリアントは practiceHref() が黙って既定に落とす
        if (variant !== undefined) {
          expect(isPracticeVariantOf(slug, variant), lesson.slug).toBe(true);
        }
      }
    }
  });
});
