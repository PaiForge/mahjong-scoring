import { describe, expect, it } from "vitest";
import { HaiKind } from "@pai-forge/riichi-mahjong";

import { haisToMspz, parseHais } from "./mspz-serializer";

describe("haisToMspz", () => {
  it("同じ牌の並びを 1 つの花色にまとめる", () => {
    expect(haisToMspz([HaiKind.ManZu1, HaiKind.ManZu1, HaiKind.ManZu1])).toBe(
      "111m",
    );
  });

  it("花色をまたぐ並びを MSPZ の花色順（m→p→s→z）で並べる", () => {
    expect(haisToMspz([HaiKind.Ton, HaiKind.SouZu2, HaiKind.PinZu3])).toBe(
      "3p2s1z",
    );
  });

  it("空配列は空文字列になる", () => {
    expect(haisToMspz([])).toBe("");
  });

  it("parseHais で元の牌へ戻せる", () => {
    const hais = [
      HaiKind.ManZu9,
      HaiKind.ManZu9,
      HaiKind.ManZu9,
      HaiKind.ManZu9,
    ];
    expect(parseHais(haisToMspz(hais))).toEqual(hais);
  });
});
