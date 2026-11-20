import { describe, expect, it } from "vitest";
import {
  getYakuHanEntries,
  isKuisagariEntry,
  normalizeYakuHanRange,
  YAKU_HAN_ENTRIES,
} from "@mahjong-scoring/core";

import { practiceMenuBySlug } from "../../practice-menu-types";
import { YAKU_HAN_VARIANT_RANGES } from "./variants";

describe("YAKU_HAN_VARIANT_RANGES", () => {
  const ranges = Object.values(YAKU_HAN_VARIANT_RANGES);

  it("レジストリの役翻数練習のバリアントをすべて、過不足なく覆う", () => {
    expect(new Set(Object.keys(YAKU_HAN_VARIANT_RANGES))).toEqual(
      new Set(practiceMenuBySlug("yaku-han").variants),
    );
  });

  it("どの出題範囲も core の範囲の語彙にあり、既定値に丸められない", () => {
    for (const range of ranges) {
      expect(normalizeYakuHanRange(range)).toBe(range);
    }
  });

  it("バリアントごとに別の出題範囲を指す", () => {
    expect(new Set(ranges).size).toBe(ranges.length);
  });

  it("「食い下がりなし」は食い下がりのある役を出さない", () => {
    const entries = getYakuHanEntries(YAKU_HAN_VARIANT_RANGES.no_kuisagari);
    expect(entries.length).toBeGreaterThan(0);
    expect(entries.some(isKuisagariEntry)).toBe(false);
  });

  it("「食い下がり」は食い下がりのある役だけを出す", () => {
    const entries = getYakuHanEntries(YAKU_HAN_VARIANT_RANGES.kuisagari);
    expect(entries.length).toBeGreaterThan(0);
    expect(entries.every(isKuisagariEntry)).toBe(true);
  });

  it("「すべて」はすべての役を出す", () => {
    expect(getYakuHanEntries(YAKU_HAN_VARIANT_RANGES.all)).toEqual(
      YAKU_HAN_ENTRIES,
    );
  });
});
