import { describe, expect, it } from "vitest";
import { totalFuChoices } from "@mahjong-scoring/core";

import { practiceMenuBySlug } from "../../practice-menu-types";
import { TOTAL_FU_VARIANT_RANGES } from "./variants";

/** 範囲で正解になりうる最大の符 */
function maxFuOf(range: Parameters<typeof totalFuChoices>[0]): number {
  return Math.max(...totalFuChoices(range));
}

describe("TOTAL_FU_VARIANT_RANGES", () => {
  const ranges = Object.values(TOTAL_FU_VARIANT_RANGES);

  it("レジストリの合計符練習のバリアントをすべて、過不足なく覆う", () => {
    expect(new Set(Object.keys(TOTAL_FU_VARIANT_RANGES))).toEqual(
      new Set(practiceMenuBySlug("total-fu").variants),
    );
  });

  it("どの出題範囲も core の範囲の語彙にあり、回答の選択肢を持つ", () => {
    for (const range of ranges) {
      expect(totalFuChoices(range).length, range).toBeGreaterThan(0);
    }
  });

  it("バリアントごとに別の出題範囲を指す", () => {
    expect(new Set(ranges).size).toBe(ranges.length);
  });

  it("「40符まで」「60符まで」は名前の符までを出題する", () => {
    expect(maxFuOf(TOTAL_FU_VARIANT_RANGES.up_to_40)).toBe(40);
    expect(maxFuOf(TOTAL_FU_VARIANT_RANGES.up_to_60)).toBe(60);
  });

  it("「すべて」はどの範囲よりも広い", () => {
    const all = totalFuChoices(TOTAL_FU_VARIANT_RANGES.all);
    for (const range of ranges) {
      expect(all, range).toEqual(
        expect.arrayContaining([...totalFuChoices(range)]),
      );
    }
    expect(maxFuOf(TOTAL_FU_VARIANT_RANGES.all)).toBeGreaterThan(
      maxFuOf(TOTAL_FU_VARIANT_RANGES.up_to_60),
    );
  });
});
