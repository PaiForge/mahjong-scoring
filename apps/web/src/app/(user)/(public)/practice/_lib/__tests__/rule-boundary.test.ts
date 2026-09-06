import { describe, expect, it } from "vitest";

import { ruleBoundaryExclusions } from "../rule-boundary";

describe("ruleBoundaryExclusions", () => {
  it("チャレンジ（記録あり）では境界の手を両方落とす", () => {
    expect(ruleBoundaryExclusions(false)).toEqual({
      excludeKiriageBoundary: true,
      excludeYakumanRuleBoundary: true,
    });
  });

  it("トレーニングでは設定どおりに出題する（境界の手も出す）", () => {
    expect(ruleBoundaryExclusions(true)).toEqual({
      excludeKiriageBoundary: false,
      excludeYakumanRuleBoundary: false,
    });
  });
});
