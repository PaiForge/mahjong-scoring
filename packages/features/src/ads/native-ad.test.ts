import { describe, expect, it } from "vitest";

import { AD_KINDS, MOBILE_AD_SLOTS, nativeAdsApiPath } from "./native-ad";

describe("AD_KINDS", () => {
  // 形の綴りは DB（`ad_creatives.kind`）と広告配信 API の応答で同じ文字列を使う
  it("どの形もネイティブ広告として snake_case で名乗る", () => {
    expect(AD_KINDS.length).toBeGreaterThan(0);
    for (const kind of AD_KINDS) {
      expect(kind).toMatch(/^native_[a-z]+$/);
    }
  });

  it("同じ形を 2 度並べない", () => {
    expect(new Set(AD_KINDS).size).toBe(AD_KINDS.length);
  });
});

describe("MOBILE_AD_SLOTS", () => {
  const slots = Object.values(MOBILE_AD_SLOTS);

  it("アプリの画面に置くスロットが 1 つ以上ある", () => {
    expect(slots.length).toBeGreaterThan(0);
  });

  // スロットはリンクのトラッキング ID ごとに成果を分ける単位なので、2 つの画面が
  // 同じ綴りを共有すると成果が混ざる
  it("2 つの画面が同じスロットを共有しない", () => {
    expect(new Set(slots).size).toBe(slots.length);
  });

  // web の同じ画面のスロットと綴りが衝突しないよう、アプリのスロットは mobile- で始める
  it("どのスロットもアプリのネイティブ広告の綴り（mobile-…-native-ad）", () => {
    for (const slot of slots) {
      expect(slot).toMatch(/^mobile-[a-z]+(-[a-z]+)*-native-ad$/);
    }
  });

  it("スロットの綴りはそのまま広告配信 API のパスに載る", () => {
    for (const slot of slots) {
      expect(nativeAdsApiPath(slot)).toBe(`/api/ads/${slot}`);
    }
  });
});

describe("nativeAdsApiPath", () => {
  it("スロットを 1 つのパスの区切りとしてエスケープして埋める", () => {
    expect(nativeAdsApiPath("a/b c")).toBe("/api/ads/a%2Fb%20c");
  });
});
