import { describe, expect, it } from "vitest";

import { formatLessonPoints } from "./quiz-labels";

describe("formatLessonPoints", () => {
  it("言語を省くと日本語の桁区切り（従来どおり）", () => {
    expect(formatLessonPoints(12000)).toBe("12,000");
    expect(formatLessonPoints(12000)).toBe(formatLessonPoints(12000, "ja"));
    expect(formatLessonPoints(800)).toBe("800");
  });

  it("英語も 3 桁ごとのカンマで区切る", () => {
    expect(formatLessonPoints(48000, "en")).toBe("48,000");
  });
});
