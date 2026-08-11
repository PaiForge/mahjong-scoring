import { describe, expect, it } from "vitest";

import {
  MANGAN_MIN_HAN,
  PRACTICE_HAN_TIERS,
  practiceHanTier,
} from "../han-tiers";

describe("PRACTICE_HAN_TIERS", () => {
  it("excludes doubleYakuman so 26 翻以上も役満として扱われる", () => {
    expect(PRACTICE_HAN_TIERS.map((tier) => tier.key)).toEqual([
      "yakuman",
      "sanbaiman",
      "baiman",
      "haneman",
      "mangan",
    ]);
  });

  it("keeps the 翻数しきい値 that the answer form offers", () => {
    expect(PRACTICE_HAN_TIERS.map((tier) => tier.minHan)).toEqual([
      13, 11, 8, 6, 5,
    ]);
  });
});

describe("MANGAN_MIN_HAN", () => {
  it("is the mangan threshold", () => {
    expect(MANGAN_MIN_HAN).toBe(5);
  });
});

describe("practiceHanTier", () => {
  it("returns undefined below mangan", () => {
    expect(practiceHanTier(1)).toBeUndefined();
    expect(practiceHanTier(4)).toBeUndefined();
  });

  it.each([
    [5, "mangan"],
    [6, "haneman"],
    [7, "haneman"],
    [8, "baiman"],
    [10, "baiman"],
    [11, "sanbaiman"],
    [12, "sanbaiman"],
    [13, "yakuman"],
  ])("maps %i 翻 to %s", (han, key) => {
    expect(practiceHanTier(han)?.key).toBe(key);
  });

  it("caps at yakuman for ダブル役満相当の翻数", () => {
    expect(practiceHanTier(26)?.key).toBe("yakuman");
    expect(practiceHanTier(39)?.key).toBe("yakuman");
  });
});
