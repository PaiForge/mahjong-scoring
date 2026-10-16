import { describe, expect, it } from "vitest";

import { rankBySlug } from "../ranks/registry";
import { relatedChaptersForPractice } from "./catalog";
import { practiceChapterSection } from "./chapter-section";

describe("practiceChapterSection", () => {
  it("練習は「関連するレッスン」で関連章を返す", () => {
    expect(practiceChapterSection("jantou-fu")).toEqual({
      titleKey: "practice.requiredKnowledge",
      slugs: relatedChaptersForPractice("jantou-fu"),
    });
  });

  it("昇級試験は「前提となるレッスン」でその級の前提章をすべて返す", () => {
    expect(practiceChapterSection("fu-exam")).toEqual({
      titleKey: "dojo.chaptersTitle",
      slugs: rankBySlug("kyu-4")?.learnChapterSlugs,
    });
  });
});
