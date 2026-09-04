import { describe, it, expect } from "vitest";
import { HaiKind, type HaiKindId } from "@pai-forge/riichi-mahjong";
import { generateDoraMarkers } from "./dora-utils";
import { validateHaiKindId } from "../../core/type-guards";

/** 全34牌種 */
const ALL_KINDS: readonly HaiKindId[] = Array.from({ length: 34 }, (_, i) => {
  const result = validateHaiKindId(i);
  if (result.isErr()) throw new Error(`牌種ID ${i} が不正`);
  return result.value;
});

/** 指定の牌を n 枚並べる */
function repeat(hai: HaiKindId, count: number): HaiKindId[] {
  return Array.from({ length: count }, () => hai);
}

describe("generateDoraMarkers", () => {
  it("表示牌の枚数は 1 + 槓子数", () => {
    expect(generateDoraMarkers(0, [])).toHaveLength(1);
    expect(generateDoraMarkers(1, [])).toHaveLength(2);
    expect(generateDoraMarkers(4, [])).toHaveLength(5);
  });

  it("すでに4枚使われている牌種は選ばない", () => {
    // 五筒を暗槓した手で五筒がドラ表示牌になると、その牌が5枚要ることになる。
    const used = repeat(HaiKind.PinZu5, 4);

    for (let i = 0; i < 500; i++) {
      const markers = generateDoraMarkers(3, used);
      expect(markers).toBeDefined();
      expect(markers).not.toContain(HaiKind.PinZu5);
    }
  });

  it("表示牌どうしでも同じ牌種が4枚を超えない", () => {
    // 五筒だけ 1 枚残し、他の33種は使い切った山。2枚目の表示牌は取れない。
    const used = [
      ...ALL_KINDS.filter((kind) => kind !== HaiKind.PinZu5).flatMap((kind) =>
        repeat(kind, 4),
      ),
      ...repeat(HaiKind.PinZu5, 3),
    ];

    expect(generateDoraMarkers(0, used)).toEqual([HaiKind.PinZu5]);
    expect(generateDoraMarkers(1, used)).toBeUndefined();
  });

  it("使える牌が尽きていれば undefined を返す", () => {
    const used = ALL_KINDS.flatMap((kind) => repeat(kind, 4));

    expect(generateDoraMarkers(0, used)).toBeUndefined();
  });
});
