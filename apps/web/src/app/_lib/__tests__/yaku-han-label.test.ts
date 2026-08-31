import { describe, expect, it } from "vitest";
import { YAKUMAN_HAN } from "@mahjong-scoring/core";

import { yakuHanLabel } from "../yaku-han-label";

/** 引かれたキーと値をそのまま返す差し替え翻訳 */
const t = (key: string, values?: { readonly count: number }) =>
  values === undefined ? key : `${key}:${values.count}`;

describe("yakuHanLabel", () => {
  it("役満は翻数ではなく区分の名前で呼ぶ", () => {
    expect(yakuHanLabel(YAKUMAN_HAN, t)).toBe("yakuman");
  });

  it("役満未満は翻数で呼ぶ", () => {
    expect(yakuHanLabel(1, t)).toBe("hanUnit:1");
    expect(yakuHanLabel(YAKUMAN_HAN - 1, t)).toBe(`hanUnit:${YAKUMAN_HAN - 1}`);
  });
});
