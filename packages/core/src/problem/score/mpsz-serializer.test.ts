import { describe, expect, it } from "vitest";
import { HaiKind } from "@pai-forge/riichi-mahjong";

import { haisToMpsz, parseHais } from "./mpsz-serializer";

describe("haisToMpsz", () => {
  it("同じ牌の並びを 1 つの花色にまとめる", () => {
    expect(haisToMpsz([HaiKind.ManZu1, HaiKind.ManZu1, HaiKind.ManZu1])).toBe(
      "111m",
    );
  });

  it("花色をまたぐ並びを MPSZ の花色順（m→p→s→z）で並べる", () => {
    expect(haisToMpsz([HaiKind.Ton, HaiKind.SouZu2, HaiKind.PinZu3])).toBe(
      "3p2s1z",
    );
  });

  it("空配列は空文字列になる", () => {
    expect(haisToMpsz([])).toBe("");
  });

  it("parseHais で元の牌へ戻せる", () => {
    const hais = [
      HaiKind.ManZu9,
      HaiKind.ManZu9,
      HaiKind.ManZu9,
      HaiKind.ManZu9,
    ];
    expect(parseHais(haisToMpsz(hais))).toEqual(hais);
  });
});
