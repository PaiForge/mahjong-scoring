import { afterEach, describe, expect, it, vi } from "vitest";

import { getIndexableAlternates, productionUrl } from "./seo-alternates";

const ORIGIN = "https://score.mahjong.help";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("getIndexableAlternates", () => {
  it("両言語で索引させるページは ja・en・x-default（x-default は日本語）", () => {
    expect(getIndexableAlternates("/reference/score-table")).toEqual({
      ja: `${ORIGIN}/reference/score-table`,
      en: `${ORIGIN}/en/reference/score-table`,
      "x-default": `${ORIGIN}/reference/score-table`,
    });
  });

  it("キーの順は ja・en・x-default", () => {
    expect(
      Object.keys(getIndexableAlternates("/reference/score-table")),
    ).toEqual(["ja", "en", "x-default"]);
  });

  it.each([
    ["/lessons/jantou-fu"],
    ["/lessons"],
    ["/reference/yaku"],
    ["/reference/glossary"],
    ["/reference/glossary/jantou"],
  ])("両言語で公開したページ %s も ja・en・x-default", (path) => {
    expect(getIndexableAlternates(path)).toEqual({
      ja: `${ORIGIN}${path}`,
      en: `${ORIGIN}/en${path}`,
      "x-default": `${ORIGIN}${path}`,
    });
  });

  it.each([
    ["/practice"],
    ["/getting-started"],
    ["/lessons/about-this-app"],
    ["/reference/demo"],
  ])(
    "日本語だけのページ %s は ja と x-default だけ（未訳の英語を挙げない）",
    (path) => {
      const alternates = getIndexableAlternates(path);
      expect(Object.keys(alternates)).toEqual(["ja", "x-default"]);
      expect(alternates.ja).toBe(alternates["x-default"]);
    },
  );

  it("トップは日本語が末尾スラッシュ無しの origin、英語が /en（sitemap・canonical の出力に揃える）", () => {
    expect(getIndexableAlternates("/")).toEqual({
      ja: ORIGIN,
      en: `${ORIGIN}/en`,
      "x-default": ORIGIN,
    });
  });

  it.each([
    // noindex のページ
    ["/practice/jantou-fu/play"],
    ["/sign-in"],
    ["/mypage"],
    ["/u/alice"],
    // 実在しないページ
    ["/nonexistent"],
    // app/[locale] の外
    ["/admin"],
    ["/api/version"],
  ])("索引させないページ %s は空", (path) => {
    expect(getIndexableAlternates(path)).toEqual({});
  });

  it("query・hash を URL に混ぜない", () => {
    expect(getIndexableAlternates("/reference/score-table?x=1#top")).toEqual(
      getIndexableAlternates("/reference/score-table"),
    );
  });

  it("Preview や手元の NEXT_PUBLIC_SITE_URL ではなく本番の origin を使う", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://preview.example.vercel.app");
    vi.resetModules();
    const fresh = await import("./seo-alternates");
    expect(fresh.getIndexableAlternates("/reference/score-table").en).toBe(
      `${ORIGIN}/en/reference/score-table`,
    );
  });

  it("返り値は凍結されている（呼び出し側で書き換えて共有しない）", () => {
    expect(Object.isFrozen(getIndexableAlternates("/"))).toBe(true);
  });
});

describe("productionUrl", () => {
  it.each([
    ["/", "ja", ORIGIN],
    ["/", "en", `${ORIGIN}/en`],
    ["/practice?variant=all#x", "ja", `${ORIGIN}/practice`],
    ["/practice?variant=all#x", "en", `${ORIGIN}/en/practice`],
  ] as const)("%s（%s）→ %s", (path, locale, expected) => {
    expect(productionUrl(path, locale)).toBe(expected);
  });
});
