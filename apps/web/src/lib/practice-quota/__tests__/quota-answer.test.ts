// @vitest-environment node
import { describe, expect, it } from "vitest";

import { PlanBenefit } from "@mahjong-scoring/features/billing/plans";

import {
  consumeUsage,
  dailyLimit,
  failOpenUsage,
  isUnlimited,
  limitedAnswer,
  peekUsage,
  unlimitedAnswer,
} from "../quota-answer";

describe("isUnlimited", () => {
  it("Pro を販売していない間は特典が無くても無制限", () => {
    expect(isUnlimited(false, [])).toBe(true);
  });

  it("販売中は unlimited_practice を持つときだけ無制限", () => {
    expect(isUnlimited(true, [PlanBenefit.UnlimitedPractice])).toBe(true);
    expect(isUnlimited(true, [PlanBenefit.PracticeTools])).toBe(false);
    expect(isUnlimited(true, [])).toBe(false);
  });
});

describe("unlimitedAnswer", () => {
  it("許可し、残りと上限を unlimited にして宛先をそのまま返す", () => {
    expect(unlimitedAnswer({ signedIn: false, benefits: [] })).toStrictEqual({
      allowed: true,
      remaining: "unlimited",
      limit: "unlimited",
      signedIn: false,
      benefits: [],
    });
    expect(
      unlimitedAnswer({
        signedIn: true,
        benefits: [PlanBenefit.UnlimitedPractice],
      }),
    ).toMatchObject({ signedIn: true, benefits: ["unlimited_practice"] });
  });
});

describe("peekUsage", () => {
  it("残りがあれば次の 1 問を始められる", () => {
    expect(peekUsage(5, 3)).toStrictEqual({ allowed: true, remaining: 2 });
    expect(peekUsage(5, 0)).toStrictEqual({ allowed: true, remaining: 5 });
  });

  it("上限に達していれば始められず、残りは負にならない", () => {
    expect(peekUsage(5, 5)).toStrictEqual({ allowed: false, remaining: 0 });
    expect(peekUsage(5, 7)).toStrictEqual({ allowed: false, remaining: 0 });
  });
});

describe("consumeUsage", () => {
  it("上限未満なら許可し、残りはこの 1 問を含めない", () => {
    expect(consumeUsage(5, 0)).toStrictEqual({ allowed: true, remaining: 4 });
    expect(consumeUsage(1, 0)).toStrictEqual({ allowed: true, remaining: 0 });
  });

  it("上限に達していれば不許可", () => {
    expect(consumeUsage(1, 1)).toStrictEqual({ allowed: false, remaining: 0 });
    expect(consumeUsage(5, 6)).toStrictEqual({ allowed: false, remaining: 0 });
  });

  it("消費後に見た peekUsage と残りが一致する", () => {
    for (const used of [0, 1, 2, 3, 4]) {
      expect(consumeUsage(5, used).remaining).toBe(
        peekUsage(5, used + 1).remaining,
      );
    }
  });
});

describe("failOpenUsage", () => {
  it("許可し、残りは上限そのもの", () => {
    expect(failOpenUsage(5)).toStrictEqual({ allowed: true, remaining: 5 });
  });
});

describe("dailyLimit", () => {
  it("ログイン済みと未ログインで別の上限を引く", () => {
    expect(dailyLimit("score", { signedIn: true, benefits: [] })).toBe(5);
    expect(dailyLimit("score", { signedIn: false, benefits: [] })).toBe(1);
    expect(dailyLimit("tenpai-score", { signedIn: true, benefits: [] })).toBe(
      3,
    );
  });
});

describe("limitedAnswer", () => {
  it("判定と上限と宛先から答えを組み立てる", () => {
    expect(
      limitedAnswer(
        { signedIn: true, benefits: [PlanBenefit.PracticeTools] },
        5,
        { allowed: false, remaining: 0 },
      ),
    ).toStrictEqual({
      allowed: false,
      remaining: 0,
      limit: 5,
      signedIn: true,
      benefits: ["practice_tools"],
    });
  });
});
