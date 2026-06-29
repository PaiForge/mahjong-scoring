import { describe, it, expect } from "vitest";
import { HaiKind } from "@mahjong-scoring/core";
import { parseTiles } from "./parse-tiles";

describe("parseTiles", () => {
  it("数牌を花色ごとに正しく変換する", () => {
    expect(parseTiles("123m")).toEqual([
      HaiKind.ManZu1,
      HaiKind.ManZu2,
      HaiKind.ManZu3,
    ]);
    expect(parseTiles("19p")).toEqual([HaiKind.PinZu1, HaiKind.PinZu9]);
    expect(parseTiles("5s")).toEqual([HaiKind.SouZu5]);
  });

  it("字牌(z)を 1=東〜7=中 に変換する", () => {
    expect(parseTiles("1234567z")).toEqual([
      HaiKind.Ton,
      HaiKind.Nan,
      HaiKind.Sha,
      HaiKind.Pei,
      HaiKind.Haku,
      HaiKind.Hatsu,
      HaiKind.Chun,
    ]);
  });

  it("複数の花色を連結して変換する", () => {
    expect(parseTiles("234m234p234s678m55z")).toHaveLength(14);
    // 同じ花色を繰り返し書ける（一盃口など）
    expect(parseTiles("234m234m")).toEqual([
      HaiKind.ManZu2,
      HaiKind.ManZu3,
      HaiKind.ManZu4,
      HaiKind.ManZu2,
      HaiKind.ManZu3,
      HaiKind.ManZu4,
    ]);
  });

  it("不正な記法は例外を投げる", () => {
    expect(() => parseTiles("123x")).toThrow();
    expect(() => parseTiles("8z")).toThrow(); // 字牌は 1〜7
    expect(() => parseTiles("m")).toThrow(); // 数字なし
    expect(() => parseTiles("123")).toThrow(); // 花色なし
  });
});
