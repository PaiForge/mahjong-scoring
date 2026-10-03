import { describe, expect, it } from "vitest";

import { CURRICULUM_CHAPTER_SLUGS } from "../curriculum/registry";
import { RANK_REGISTRY } from "../ranks/registry";
import {
  MANGAN_KO_RON_LESSON_CHOICES,
  MANGAN_KO_RON_LESSON_QUESTIONS,
} from "./mangan-ko-ron";
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
    expect(isLessonSlug("mangan-oya-ron")).toBe(false);
    expect(isLessonSlug(undefined)).toBe(false);
  });

  it("slug と章からレッスンを引ける", () => {
    expect(lessonBySlug("mangan-ko-ron")?.rankSlug).toBe("kyu-5");
    expect(lessonBySlug("unknown")).toBeUndefined();
    expect(lessonForChapter("mangan-ko-ron")?.slug).toBe("mangan-ko-ron");
    expect(lessonForChapter("yaku")).toBeUndefined();
  });

  it("完了したレッスンから学んだ章を引き、未知の slug は無視する", () => {
    expect(
      chaptersLearnedByLessons(new Set(["mangan-ko-ron", "unknown"])),
    ).toEqual(new Set(["mangan-ko-ron"]));
    expect(chaptersLearnedByLessons(new Set())).toEqual(new Set());
  });
});

describe("子のロン（満貫以上）レッスンの確認問題", () => {
  it("満貫 → 跳満 → 倍満 の 3 問で、翻数と点数が点数表と一致する", () => {
    expect(MANGAN_KO_RON_LESSON_QUESTIONS).toEqual([
      { tierKey: "mangan", han: 5, answer: 8000 },
      { tierKey: "haneman", han: 6, answer: 12000 },
      { tierKey: "baiman", han: 8, answer: 16000 },
    ]);
  });

  it("選択肢は満貫〜役満の子のロンの点数で、正解をすべて含む", () => {
    expect(MANGAN_KO_RON_LESSON_CHOICES).toEqual([
      8000, 12000, 16000, 24000, 32000,
    ]);
    for (const question of MANGAN_KO_RON_LESSON_QUESTIONS) {
      expect(MANGAN_KO_RON_LESSON_CHOICES).toContain(question.answer);
    }
  });
});
