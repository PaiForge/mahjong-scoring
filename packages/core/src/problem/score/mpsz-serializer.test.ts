import { describe, expect, it } from "vitest";
import { HaiKind } from "@pai-forge/riichi-mahjong";

import { haisToMpsz, parseHais, parseTehai } from "./mpsz-serializer";

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

describe("parseTehai", () => {
  it("面子ごとに書いた表記でも純手牌を理牌して返す", () => {
    expect(parseTehai("234m22m567p11z")?.closed).toEqual([
      HaiKind.ManZu2,
      HaiKind.ManZu2,
      HaiKind.ManZu2,
      HaiKind.ManZu3,
      HaiKind.ManZu4,
      HaiKind.PinZu5,
      HaiKind.PinZu6,
      HaiKind.PinZu7,
      HaiKind.Ton,
      HaiKind.Ton,
    ]);
  });

  it("晒した面子は表記の順のまま返す", () => {
    const tehai = parseTehai("234m22m[5=55z][1-23p]");
    expect(tehai?.exposed.map((mentsu) => mentsu.hais[0])).toEqual([
      HaiKind.Haku,
      HaiKind.PinZu1,
    ]);
  });
});

describe("parseHais", () => {
  it("理牌して返す", () => {
    expect(parseHais("7z123m")).toEqual([
      HaiKind.ManZu1,
      HaiKind.ManZu2,
      HaiKind.ManZu3,
      HaiKind.Chun,
    ]);
  });
});
