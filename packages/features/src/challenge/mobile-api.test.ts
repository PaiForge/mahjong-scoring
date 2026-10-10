import { describe, expect, it } from "vitest";

import {
  mobileChallengeApiPath,
  parseMobileAnswerResponse,
  parseMobileFinishResponse,
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

describe("parseMobileFinishResponse", () => {
  const exp = {
    earnedExp: 12,
    totalExp: 340,
    level: 3,
    levelUp: false,
    progressPercent: 40,
  };

  it("経験値つきの応答を読む", () => {
    expect(parseMobileFinishResponse({ challengeResultId: "r1", exp })).toEqual(
      { challengeResultId: "r1", exp },
    );
  });

  it("経験値の無い応答（対象外の練習・古いサーバー）も読む", () => {
    expect(parseMobileFinishResponse({ challengeResultId: "r1" })).toEqual({
      challengeResultId: "r1",
    });
  });

  it("経験値の形が違えば応答ごと読まない", () => {
    expect(
      parseMobileFinishResponse({
        challengeResultId: "r1",
        exp: { ...exp, level: "3" },
      }),
    ).toBeUndefined();
  });

  it("昇級試験の応答は付与した段級位を読み、知らない段級位は落とす", () => {
    expect(
      parseMobileFinishResponse({ grantedRanks: ["kyu-4", "future-rank"] }),
    ).toEqual({ grantedRanks: ["kyu-4"] });
  });

  it("不合格の試験（付与なし）も読む", () => {
    expect(parseMobileFinishResponse({ grantedRanks: [] })).toEqual({
      grantedRanks: [],
    });
  });
});
