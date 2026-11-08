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
    ["/practice", "en", "/en/practice"],
    [
      "/practice/jantou-fu/play?variant=all",
      "en",
      "/en/practice/jantou-fu/play?variant=all",
    ],
    ["/exam/fu/result", "en", "/en/exam/fu/result"],
    ["/lessons/about-this-app", "en", "/en/lessons/about-this-app"],
    ["/getting-started", "en", "/en/getting-started"],
    ["/dojo", "en", "/en/dojo"],
    ["/dojo/ranks/kyu-5", "en", "/en/dojo/ranks/kyu-5"],
    ["/dashboard", "en", "/en/dashboard"],
    [
      "/sign-in?redirect=%2Fen%2Fmypage",
      "en",
      "/en/sign-in?redirect=%2Fen%2Fmypage",
    ],
    ["/mypage", "en", "/en/mypage"],
    ["/preferences/yaku-order", "en", "/en/preferences/yaku-order"],
    ["/terms", "en", "/en/terms"],
    ["/contact", "en", "/en/contact"],
    ["/plan", "en", "/en/plan"],
    ["/announcements", "en", "/en/announcements"],
    ["/announcements/some-news", "en", "/en/announcements/some-news"],
  ] as const)("%s（%s）→ %s", (path, locale, expected) => {
    expect(resolvePublishedHref(path, locale)).toBe(expected);
  });

  it.each([
    ["/leaderboard", "en"],
    ["/u/alice", "en"],
    ["/leaderboard/monthly/jantou-fu", "en"],
    ["/nonexistent", "ja"],
  ] as const)("未公開の %s（%s）はリンクを作らない", (path, locale) => {
    expect(resolvePublishedHref(path, locale)).toBeUndefined();
  });
});
