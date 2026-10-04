// @vitest-environment node
import { describe, expect, it } from "vitest";

import { PlanBenefit } from "@mahjong-scoring/features/billing/plans";

import {
  consumeUsage,
  isUnlimited,
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
