import { describe, expect, it } from "vitest";

import {
  mobileChallengeApiPath,
  parseMobileAnswerResponse,
  parseMobileProgressResponse,
} from "./mobile-api";

describe("parseMobileProgressResponse", () => {
  it("アプリが知らない練習・段級位は落とし、未知のバリアントは残す", () => {
    const input = parseMobileProgressResponse({
      completedLessonSlugs: ["jantou-fu"],
      attemptedPractices: [
        { slug: "jantou-fu", variant: "retired-variant" },
        { slug: "future-practice", variant: "default" },
      ],
      achievedRankSlugs: ["kyu-5", "future-rank"],
    });

    expect(input).toEqual({
      completedLessonSlugs: new Set(["jantou-fu"]),
      attemptedPractices: [{ slug: "jantou-fu", variant: "retired-variant" }],
      achievedRankSlugs: ["kyu-5"],
    });
  });

  it("形が違えば undefined", () => {
    expect(parseMobileProgressResponse({ completedLessonSlugs: "x" })).toBe(
      undefined,
    );
  });
});

describe("parseMobileAnswerResponse", () => {
  it("期限切れの応答を読む", () => {
    expect(parseMobileAnswerResponse({ expired: true })).toEqual({
      expired: true,
    });
  });

  it("採点の応答に欠けた項目があれば undefined", () => {
    expect(parseMobileAnswerResponse({ correct: true })).toBe(undefined);
  });
});

describe("mobileChallengeApiPath", () => {
  it("ID を URL の 1 区切りとして埋める", () => {
    expect(mobileChallengeApiPath("a/b", "finish")).toBe(
      "/api/mobile/v1/challenges/a%2Fb/finish",
    );
  });
});
