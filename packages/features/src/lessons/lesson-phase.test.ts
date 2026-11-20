import { describe, expect, it } from "vitest";

import { LESSON_PHASES } from "./lesson-phase";

describe("LESSON_PHASES", () => {
  it("段階の名前は空でなく重複しない（履歴の位置と段階を 1 対 1 に結ぶ）", () => {
    expect(LESSON_PHASES.length).toBeGreaterThan(0);
    expect(new Set(LESSON_PHASES).size).toBe(LESSON_PHASES.length);
    for (const phase of LESSON_PHASES) {
      expect(phase).not.toBe("");
    }
  });

  it("本文から始まり、確認問題を経て、できたことの確認で終わる", () => {
    expect(LESSON_PHASES.indexOf("learn")).toBe(0);
    expect(LESSON_PHASES.indexOf("quiz")).toBeGreaterThan(
      LESSON_PHASES.indexOf("learn"),
    );
    expect(LESSON_PHASES.indexOf("done")).toBe(LESSON_PHASES.length - 1);
  });
});
