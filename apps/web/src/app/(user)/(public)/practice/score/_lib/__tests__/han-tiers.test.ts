import { describe, expect, it } from "vitest";

import {
  MANGAN_MIN_HAN,
  practiceHanTier,
  practiceHanTiers,
} from "../han-tiers";

describe("practiceHanTiers", () => {
  it("既定（ダブル役満なし）では doubleYakuman を除き、26翻以上も役満として扱う", () => {
    expect(practiceHanTiers(false).map((tier) => tier.key)).toEqual([
      "yakuman",
      "sanbaiman",
      "baiman",
      "haneman",
      "mangan",
    ]);
  });

  it("keeps the 翻数しきい値 that the answer form offers", () => {
    expect(practiceHanTiers(false).map((tier) => tier.minHan)).toEqual([
      13, 11, 8, 6, 5,
    ]);
  });

  it("ダブル役満採用時は doubleYakuman を含む", () => {
    expect(practiceHanTiers(true).map((tier) => tier.key)).toEqual([
      "doubleYakuman",
      "yakuman",
      "sanbaiman",
      "baiman",
      "haneman",
      "mangan",
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

  it("ダブル役満採用時は26翻以上を doubleYakuman に割り当てる", () => {
    expect(practiceHanTier(26, true)?.key).toBe("doubleYakuman");
    expect(practiceHanTier(25, true)?.key).toBe("yakuman");
  });
});
