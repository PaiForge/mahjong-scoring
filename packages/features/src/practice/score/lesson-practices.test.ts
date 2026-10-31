import { describe, expect, it } from "vitest";
import { SCORE_FILTERABLE_YAKU } from "@mahjong-scoring/core";

import { isCurriculumChapterSlug } from "../../curriculum/registry";
import {
  LESSON_SCORE_PRACTICES,
  lessonScorePractice,
} from "./lesson-practices";

describe("LESSON_SCORE_PRACTICES", () => {
  it("役の絞り込みは生成器が作れる役だけを使う", () => {
    for (const { pick } of Object.values(LESSON_SCORE_PRACTICES)) {
      for (const name of pick.yaku ?? []) {
        expect(SCORE_FILTERABLE_YAKU).toContain(name);
      }
    }
  });

  it("どれも目次にある章に結び付く", () => {
    for (const slug of Object.keys(LESSON_SCORE_PRACTICES)) {
      expect(isCurriculumChapterSlug(slug)).toBe(true);
    }
  });
});

describe("lessonScorePractice", () => {
  it("章の slug から引ける", () => {
    expect(lessonScorePractice("pinfu-score")?.pick.yaku).toEqual(["平和"]);
  });

  it("絞り込み練習を持たない章・未知の値・未指定は undefined", () => {
    expect(lessonScorePractice("jantou-fu")).toBeUndefined();
    expect(lessonScorePractice("toString")).toBeUndefined();
    expect(lessonScorePractice(undefined)).toBeUndefined();
  });
});
