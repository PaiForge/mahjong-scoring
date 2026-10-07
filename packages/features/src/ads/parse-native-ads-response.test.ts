import { describe, expect, it } from "vitest";

import { nativeAdsApiPath } from "./native-ad";
import { parseNativeAdsResponse } from "./parse-native-ads-response";

const ad = {
  id: "a",
  kind: "native_card",
  href: "https://www.amazon.co.jp/dp/4000000000?tag=example-22",
  imageAlt: "",
  title: "本",
};

describe("parseNativeAdsResponse", () => {
  it("JSON で落ちた項目は undefined として読む", () => {
    expect(parseNativeAdsResponse({ ads: [ad] })).toEqual({
      ads: [
        {
          ...ad,
          icon: undefined,
          imageUrl: undefined,
          hand: undefined,
          description: undefined,
        },
      ],
    });
  });

  it("手牌は牌種 ID の並びとして読む", () => {
    const parsed = parseNativeAdsResponse({ ads: [{ ...ad, hand: [0, 33] }] });
    expect(parsed?.ads[0]?.hand).toEqual([0, 33]);
  });

  it.each([
    ["牌種 ID の範囲外の手牌", { ...ad, hand: [34] }],
    ["知らない形", { ...ad, kind: "banner" }],
    ["http(s) 以外のリンク", { ...ad, href: "javascript:alert(1)" }],
    ["アプリのスキームのリンク", { ...ad, href: "mahjong-scoring://practice" }],
    ["タイトルが無い", { ...ad, title: undefined }],
  ])("%s を含む応答は全体を捨てる", (_, invalid) => {
    expect(parseNativeAdsResponse({ ads: [ad, invalid] })).toBeUndefined();
  });

  it("形の違う応答は undefined", () => {
    expect(parseNativeAdsResponse(undefined)).toBeUndefined();
    expect(parseNativeAdsResponse({ error: "x" })).toBeUndefined();
  });
});

describe("nativeAdsApiPath", () => {
  it("スロットをパスに埋める", () => {
    expect(nativeAdsApiPath("mobile-practice-grid-native-ad")).toBe(
      "/api/ads/mobile-practice-grid-native-ad",
    );
  });
});
