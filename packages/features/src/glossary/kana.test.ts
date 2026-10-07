import { describe, expect, it } from "vitest";

import { kanaRowOf } from "./kana";

describe("kanaRowOf", () => {
  it("清音の読みをその行に入れる", () => {
    expect(kanaRowOf("メンツ")).toBe("ま");
    expect(kanaRowOf("シュンツ")).toBe("さ");
    expect(kanaRowOf("テハイ")).toBe("た");
  });

  it("濁点・半濁点は清音の行に寄せる", () => {
    expect(kanaRowOf("ジハイ")).toBe("さ");
    expect(kanaRowOf("バイマン")).toBe("は");
    expect(kanaRowOf("ピンフ")).toBe("は");
    expect(kanaRowOf("ドラ")).toBe("た");
  });

  it("ン で始まる読みは わ行 に入る", () => {
    expect(kanaRowOf("ンー")).toBe("わ");
  });

  it("空文字列や行に当たらない読みは undefined", () => {
    expect(kanaRowOf("")).toBeUndefined();
    expect(kanaRowOf("3900")).toBeUndefined();
  });
});
