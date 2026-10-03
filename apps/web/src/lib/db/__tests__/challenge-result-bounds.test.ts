import { describe, expect, it } from "vitest";

import {
  isPlausibleChallengeResult,
  isPlausibleExamScore,
  maxAnswersWithin,
} from "@mahjong-scoring/features/challenge/challenge-result-bounds";
import { practiceMenuByType } from "@mahjong-scoring/features/practice-menu-types";
import { RANK_REGISTRY } from "@mahjong-scoring/features/ranks/registry";

const RULES = { mistakeLimit: 3, timeLimit: 60 };

describe("maxAnswersWithin", () => {
  it("60 秒なら 800ms 間隔で 75 問 + 時間切れ間際の 1 問", () => {
    expect(maxAnswersWithin(60)).toBe(76);
  });
});

describe("isPlausibleChallengeResult", () => {
  it("上限ちょうどは受け付ける", () => {
    expect(
      isPlausibleChallengeResult(RULES, {
        score: 73,
        incorrectAnswers: 3,
        timeTaken: 61,
      }),
    ).toBe(true);
  });

  it.each([
    ["回答数が上限を超える", { score: 74, incorrectAnswers: 3, timeTaken: 60 }],
    [
      "誤答がミス上限を超える",
      { score: 0, incorrectAnswers: 4, timeTaken: 10 },
    ],
    [
      "経過時間が制限時間を超える",
      { score: 0, incorrectAnswers: 0, timeTaken: 62 },
    ],
    ["小数", { score: 1.5, incorrectAnswers: 0, timeTaken: 10 }],
    ["負値", { score: 0, incorrectAnswers: 0, timeTaken: -1 }],
    ["無限大", { score: Infinity, incorrectAnswers: 0, timeTaken: 10 }],
  ])("%s は弾く", (_label, fields) => {
    expect(isPlausibleChallengeResult(RULES, fields)).toBe(false);
  });
});

describe("isPlausibleExamScore", () => {
  /**
   * 合格点が上限を超えていると、正規に解いた受験者が合格できなくなる。
   * 試験の制限時間や合格点を動かしたときに気づけるように全件で確かめる。
   */
  it("どの試験も合格点は上限以内", () => {
    for (const rank of RANK_REGISTRY) {
      const rules = practiceMenuByType(rank.exam.menuType);
      expect(isPlausibleExamScore(rules, rank.exam.minScore)).toBe(true);
    }
  });

  it("負値・上限超えは弾く", () => {
    expect(isPlausibleExamScore(RULES, -1)).toBe(false);
    expect(isPlausibleExamScore(RULES, 77)).toBe(false);
  });
});
