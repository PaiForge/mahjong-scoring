import { describe, expect, it } from "vitest";

import { backFallbackHref } from "./back-fallback";

describe("backFallbackHref", () => {
  it("レッスンはレッスンの目次へ", () => {
    expect(backFallbackHref("/lessons/why-scoring-is-complex")).toBe(
      "/lessons",
    );
  });

  it("道場の下と昇級試験は道場へ", () => {
    expect(backFallbackHref("/dojo/ranks/kyu-5")).toBe("/dojo");
    expect(backFallbackHref("/exam/mangan")).toBe("/dojo");
  });

  it("参照の下は参照の入口へ、入口は点数表のタブへ", () => {
    expect(backFallbackHref("/reference/yaku")).toBe("/reference");
    expect(backFallbackHref("/reference")).toBe("/score-table");
  });

  it("設定の下は設定へ、設定はホームへ", () => {
    expect(backFallbackHref("/preferences/yaku-order")).toBe("/preferences");
    expect(backFallbackHref("/preferences")).toBe("/");
  });

  it("アカウントの画面は入口の設定へ", () => {
    expect(backFallbackHref("/sign-in")).toBe("/preferences");
    expect(backFallbackHref("/sign-up")).toBe("/preferences");
    expect(backFallbackHref("/mypage/setup-username")).toBe("/preferences");
    expect(backFallbackHref("/mypage/account/delete")).toBe("/preferences");
  });

  it("マイページは入口のホームへ", () => {
    expect(backFallbackHref("/mypage")).toBe("/");
  });

  it("練習とそれ以外は練習一覧へ", () => {
    expect(backFallbackHref("/practice/jantou-fu")).toBe("/practice");
    expect(backFallbackHref("/unknown")).toBe("/practice");
  });
});
