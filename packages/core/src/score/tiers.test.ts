import { describe, expect, it } from "vitest";
import {
  clampHanToYakuman,
  isFuRelevant,
  isYakumanHan,
  YAKUMAN_HAN,
} from "./tiers";

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

describe("isFuRelevant", () => {
  it("4翻以下は符が点数を左右する（符で満貫に届く手を含む）", () => {
    expect(isFuRelevant(1)).toBe(true);
    expect(isFuRelevant(3)).toBe(true);
    expect(isFuRelevant(4)).toBe(true);
  });

  it("5翻以上は符によらず満貫以上なので符は効かない", () => {
    expect(isFuRelevant(5)).toBe(false);
    expect(isFuRelevant(YAKUMAN_HAN)).toBe(false);
  });
});
