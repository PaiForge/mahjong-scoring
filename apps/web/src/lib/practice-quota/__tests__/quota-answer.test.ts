// @vitest-environment node
import { describe, expect, it } from "vitest";

import { PlanBenefit } from "@mahjong-scoring/features/billing/plans";

import { isUnlimited, unlimitedAnswer } from "../quota-answer";

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
