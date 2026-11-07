import { describe, expect, it, vi } from "vitest";

// next-intl の navigation は next/navigation のフックを読む。ここで確かめるのは
// 公開状態と最終 href の組み立てだけなので、束ねる部分は空の実装にする
vi.mock("next-intl/navigation", () => ({
  createNavigation: () => ({
    Link: () => null,
    redirect: vi.fn(),
    usePathname: vi.fn(),
    useRouter: vi.fn(),
    getPathname: vi.fn(),
  }),
}));

import { resolvePublishedHref } from "./navigation";

describe("resolvePublishedHref", () => {
  it.each([
    ["/reference/score-table", "ja", "/reference/score-table"],
    ["/reference/score-table", "en", "/en/reference/score-table"],
    [
      "/reference/score-table?x=1#top",
      "en",
      "/en/reference/score-table?x=1#top",
    ],
    // 日本語は接頭辞なしの最終 URL（/ja を経由しない）
    ["/", "ja", "/"],
    // 英語のトップは /en（末尾スラッシュを付けない）
    ["/", "en", "/en"],
    ["/lessons/jantou-fu", "en", "/en/lessons/jantou-fu"],
    ["/lessons?rank=kyu-5", "en", "/en/lessons?rank=kyu-5"],
    ["/reference/glossary/jantou", "en", "/en/reference/glossary/jantou"],
    [
      "/practice/jantou-fu/play?variant=all",
      "ja",
      "/practice/jantou-fu/play?variant=all",
    ],
  ] as const)("%s（%s）→ %s", (path, locale, expected) => {
    expect(resolvePublishedHref(path, locale)).toBe(expected);
  });

  it.each([
    ["/practice", "en"],
    ["/lessons/about-this-app", "en"],
    ["/getting-started", "en"],
    ["/dashboard", "en"],
    ["/nonexistent", "ja"],
  ] as const)("未公開の %s（%s）はリンクを作らない", (path, locale) => {
    expect(resolvePublishedHref(path, locale)).toBeUndefined();
  });
});
