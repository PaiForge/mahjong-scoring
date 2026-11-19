import { describe, expect, it } from "vitest";
import { HaiKind } from "@pai-forge/riichi-mahjong";

import {
  haiIdToMpsz,
  haisToMpsz,
  parseHais,
  parseKazehai,
  parseTehai,
} from "./mpsz-serializer";

describe("haiIdToMpsz", () => {
  it("数牌 1 枚を数字と花色の 2 文字にする", () => {
    expect(haiIdToMpsz(HaiKind.PinZu7)).toBe("7p");
  });

  it("字牌 1 枚を z の表記にする", () => {
    expect(haiIdToMpsz(HaiKind.Chun)).toBe("7z");
  });
});

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

describe("parseTehai の読めない入力", () => {
  it("undefined と空文字列は undefined を返す", () => {
    expect(parseTehai(undefined)).toBeUndefined();
    expect(parseTehai("")).toBeUndefined();
  });

  it("MPSZ として読めない文字列は undefined を返す", () => {
    expect(parseTehai("xyz")).toBeUndefined();
  });

  it("赤 5 は通常の 5 として読む", () => {
    expect(parseTehai("0m")?.closed).toEqual([HaiKind.ManZu5]);
  });
});

describe("parseHais", () => {
  it("読めない文字列と undefined は空配列を返す", () => {
    expect(parseHais(undefined)).toEqual([]);
    expect(parseHais("xyz")).toEqual([]);
  });

  it("晒した面子は含めず純手牌だけを返す", () => {
    expect(parseHais("22m[5=55z]")).toEqual([HaiKind.ManZu2, HaiKind.ManZu2]);
  });

  it("理牌して返す", () => {
    expect(parseHais("7z123m")).toEqual([
      HaiKind.ManZu1,
      HaiKind.ManZu2,
      HaiKind.ManZu3,
      HaiKind.Chun,
    ]);
  });
});

describe("parseKazehai", () => {
  it.each([
    ["1z", HaiKind.Ton],
    ["2z", HaiKind.Nan],
    ["3z", HaiKind.Sha],
    ["4z", HaiKind.Pei],
  ])("風牌 %s をその風の牌種にする", (str, expected) => {
    expect(parseKazehai(str)).toBe(expected);
  });

  it("三元牌は風牌ではないので undefined を返す", () => {
    expect(parseKazehai("5z")).toBeUndefined();
  });

  it("数牌は風牌ではないので undefined を返す", () => {
    expect(parseKazehai("1m")).toBeUndefined();
  });

  it("undefined・空文字列・読めない文字列は undefined を返す", () => {
    expect(parseKazehai(undefined)).toBeUndefined();
    expect(parseKazehai("")).toBeUndefined();
    expect(parseKazehai("xyz")).toBeUndefined();
  });
});
