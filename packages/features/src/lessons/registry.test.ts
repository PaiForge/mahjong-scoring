import { describe, expect, it } from "vitest";

import { CURRICULUM_CHAPTER_SLUGS } from "../curriculum/registry";
import { RANK_REGISTRY } from "../ranks/registry";
import {
  LESSON_REGISTRY,
  LESSON_SLUGS,
  chaptersLearnedByLessons,
  isLessonSlug,
  lessonBySlug,
  lessonForChapter,
} from "./registry";

describe("LESSON_REGISTRY", () => {
  it("slug が一意である", () => {
    expect(new Set(LESSON_SLUGS).size).toBe(LESSON_SLUGS.length);
  });

  it("章ごとにレッスンは高々 1 つ（章の「学んだ」の印が割れない）", () => {
    const chapters = LESSON_REGISTRY.map((lesson) => lesson.chapterSlug);
    expect(new Set(chapters).size).toBe(chapters.length);
  });

  it("対応する章は実在し、その級の前提章に含まれる", () => {
    for (const lesson of LESSON_REGISTRY) {
      expect(CURRICULUM_CHAPTER_SLUGS).toContain(lesson.chapterSlug);
      const rank = RANK_REGISTRY.find(
        (entry) => entry.slug === lesson.rankSlug,
      );
      expect(rank?.learnChapterSlugs).toContain(lesson.chapterSlug);
    }
  });

  it("isLessonSlug は登録済みの slug だけを通す", () => {
    expect(isLessonSlug("mangan-ko-ron")).toBe(true);
    expect(isLessonSlug("jantou-fu")).toBe(false);
    expect(isLessonSlug(undefined)).toBe(false);
  });

  it("slug と章からレッスンを引ける", () => {
    expect(lessonBySlug("mangan-ko-ron")?.rankSlug).toBe("kyu-5");
    expect(lessonBySlug("unknown")).toBeUndefined();
    expect(lessonForChapter("mangan-ko-ron")?.slug).toBe("mangan-ko-ron");
    expect(lessonForChapter("jantou-fu")).toBeUndefined();
  });

  it("完了したレッスンから学んだ章を引き、未知の slug は無視する", () => {
    expect(
      chaptersLearnedByLessons(new Set(["mangan-ko-ron", "unknown"])),
    ).toEqual(new Set(["mangan-ko-ron"]));
    expect(chaptersLearnedByLessons(new Set())).toEqual(new Set());
  });
});
