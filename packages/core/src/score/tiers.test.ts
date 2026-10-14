import { describe, expect, it } from "vitest";
import { clampHanToYakuman, isYakumanHan, YAKUMAN_HAN } from "./tiers";

describe("clampHanToYakuman", () => {
  it("役満未満の翻数はそのまま返す", () => {
    expect(clampHanToYakuman(1)).toBe(1);
    expect(clampHanToYakuman(12)).toBe(12);
  });

  it("役満ちょうど（数え役満）は役満の翻数を返す", () => {
    expect(clampHanToYakuman(YAKUMAN_HAN)).toBe(YAKUMAN_HAN);
  });

  it("役満超え（役満+ドラ等）は役満の翻数に丸める", () => {
    expect(clampHanToYakuman(YAKUMAN_HAN + 1)).toBe(YAKUMAN_HAN);
  });

  it("ダブル役満相当（26翻以上）も役満の翻数に丸める", () => {
    expect(clampHanToYakuman(26)).toBe(YAKUMAN_HAN);
    expect(clampHanToYakuman(34)).toBe(YAKUMAN_HAN);
  });
});

describe("isYakumanHan", () => {
  it("役満未満の翻数は役満ではない", () => {
    expect(isYakumanHan(YAKUMAN_HAN - 1)).toBe(false);
  });

  it("役満ちょうどと、それを超える翻数は役満", () => {
    expect(isYakumanHan(YAKUMAN_HAN)).toBe(true);
    expect(isYakumanHan(YAKUMAN_HAN * 2)).toBe(true);
  });
});
