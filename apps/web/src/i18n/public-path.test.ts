import { describe, expect, it } from "vitest";

import {
  internalLocalePath,
  isNonLocalizedPath,
  localizedHref,
  parseExternalPath,
  splitHref,
  stripLocalePrefix,
} from "./public-path";

describe("splitHref", () => {
  it.each([
    ["/a", { pathname: "/a", search: "", hash: "" }],
    ["/a?b=1", { pathname: "/a", search: "?b=1", hash: "" }],
    ["/a#c", { pathname: "/a", search: "", hash: "#c" }],
    ["/a?b=1#c", { pathname: "/a", search: "?b=1", hash: "#c" }],
    ["/a#c?b=1", { pathname: "/a", search: "", hash: "#c?b=1" }],
  ])("%s をパス・query・hash に分ける", (href, expected) => {
    expect(splitHref(href)).toEqual(expected);
  });
});

describe("parseExternalPath", () => {
  it.each([
    ["/", "ja", "/", undefined, true],
    ["/practice", "ja", "/practice", undefined, true],
    // セグメント単位の判定: /english・/enx・/japan は日本語のパス
    ["/english", "ja", "/english", undefined, true],
    ["/enx/practice", "ja", "/enx/practice", undefined, true],
    ["/japan", "ja", "/japan", undefined, true],
    ["/en", "en", "/", "/en", true],
    ["/en/reference/score-table", "en", "/reference/score-table", "/en", true],
    // 既定言語の接頭辞は正規形ではない（next-intl が接頭辞なしへ正規化する）
    ["/ja", "ja", "/", "/ja", false],
    ["/ja/practice", "ja", "/practice", "/ja", false],
    // 大文字の接頭辞は next-intl と同じく言い換えとして認め、正規形ではない
    ["/EN/reference/score-table", "en", "/reference/score-table", "/EN", false],
    ["/Ja/practice", "ja", "/practice", "/Ja", false],
  ] as const)(
    "%s は locale=%s・path=%s",
    (pathname, locale, path, prefix, canonical) => {
      expect(parseExternalPath(pathname)).toEqual({
        locale,
        path,
        prefix,
        canonical,
      });
    },
  );
});

describe("stripLocalePrefix", () => {
  it.each([
    ["/en/practice/jantou-fu/play", "/practice/jantou-fu/play"],
    ["/en", "/"],
    ["/practice/jantou-fu/play", "/practice/jantou-fu/play"],
    ["/english/x", "/english/x"],
  ])("%s → %s", (pathname, expected) => {
    expect(stripLocalePrefix(pathname)).toBe(expected);
  });
});

describe("localizedHref", () => {
  describe("日本語は恒等（/ja を付けない）", () => {
    it.each([
      "/",
      "/practice",
      "/practice/jantou-fu/play?variant=all",
      "/lessons/jantou-fu#quiz",
      "/api/version",
      "https://example.com/",
      "#anchor",
    ])("%s", (href) => {
      expect(localizedHref(href, "ja")).toBe(href);
    });
  });

  describe("英語はパスにだけ /en を付ける", () => {
    it.each([
      ["/", "/en"],
      ["/reference/score-table", "/en/reference/score-table"],
      ["/practice?variant=all", "/en/practice?variant=all"],
      ["/lessons/jantou-fu#quiz", "/en/lessons/jantou-fu#quiz"],
      ["/?x=1", "/en?x=1"],
      ["/english", "/en/english"],
    ])("%s → %s", (href, expected) => {
      expect(localizedHref(href, "en")).toBe(expected);
    });
  });

  describe("ロケール化しない href は英語でもそのまま", () => {
    it.each([
      "/api/version",
      "/api/stripe/webhook",
      "/auth/callback?code=x",
      "/admin",
      "/admin/users",
      "/robots.txt",
      "/sitemap.xml",
      "/favicon.ico",
      "/icon.png",
      "/apple-icon.png",
      "/tiles/Man1.webp",
      "/google9cbea86c89b56a83.html",
      "https://example.com/practice",
      "//example.com/practice",
      "mailto:info@example.com",
      "#anchor",
      "relative/path",
      // 既に英語の接頭辞が付いたものに二重に付けない
      "/en/reference/score-table",
    ])("%s", (href) => {
      expect(localizedHref(href, "en")).toBe(href);
    });
  });

  it("英語の接頭辞を外すと元のパスに戻る", () => {
    for (const path of ["/", "/reference/score-table", "/practice/x/play"]) {
      expect(stripLocalePrefix(localizedHref(path, "en"))).toBe(path);
    }
  });
});

describe("isNonLocalizedPath", () => {
  it.each([
    ["/api", true],
    ["/api/mobile/v1/me", true],
    ["/auth/callback", true],
    ["/admin", true],
    ["/admin/ads/new", true],
    ["/_next/static/chunk.js", true],
    ["/robots.txt", true],
    ["/sitemap.xml", true],
    // セグメント単位: 名前が前方一致するだけのパスは対象外にしない
    ["/apis", false],
    ["/administrator", false],
    ["/auth", false],
    ["/auth/callbacks", false],
    ["/tilesets", false],
    // ユーザー名やお知らせの slug を含む既存の URL は i18n の対象
    ["/u/alice", false],
    ["/announcements/release-1.2", false],
    ["/", false],
    ["/practice", false],
  ])("%s → %s", (pathname, expected) => {
    expect(isNonLocalizedPath(pathname)).toBe(expected);
  });
});

describe("internalLocalePath", () => {
  it("既定の言語にも接頭辞を付ける（内部のルートのパス）", () => {
    expect(internalLocalePath("/lessons", "ja")).toBe("/ja/lessons");
    expect(internalLocalePath("/lessons", "en")).toBe("/en/lessons");
    expect(internalLocalePath("/", "ja")).toBe("/ja");
    expect(internalLocalePath("/", "en")).toBe("/en");
  });

  it("query と hash はそのまま残す", () => {
    expect(internalLocalePath("/lessons/jantou-fu?x=1#y", "en")).toBe(
      "/en/lessons/jantou-fu?x=1#y",
    );
  });

  it("ロケール化しないパス・接頭辞済み・外部 URL はそのまま", () => {
    expect(internalLocalePath("/api/x", "ja")).toBe("/api/x");
    expect(internalLocalePath("/en/lessons", "ja")).toBe("/en/lessons");
    expect(internalLocalePath("https://example.com/", "en")).toBe(
      "https://example.com/",
    );
    expect(internalLocalePath("//host/x", "en")).toBe("//host/x");
  });
});
