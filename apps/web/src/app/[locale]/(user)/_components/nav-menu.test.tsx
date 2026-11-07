/**
 * NavMenu（ハンバーガーのドロワー）のリンクの言語のテスト
 *
 * @description
 * - 日本語のページ: 項目の href は今までどおり接頭辞なし、「日本語のみ」の印は付けない
 * - 英語のページ: 英語で公開している項目（設定を含む）は `/en` の href で印なし。
 *   英語で提供しないランキングだけを日本語のページへ素のリンクで向け、「日本語のみ」と添える
 */
import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";

import type { SupportedLocale } from "@mahjong-scoring/features/i18n/locales";

vi.mock("next-intl", async () => await import("@/test/intl-mock"));

vi.mock("next/link", async () => await import("@/test/next-link-mock"));

// 公開 href の表（locale-link-table）が読む next-intl のナビゲーションは、
// モジュールの評価時に redirect / permanentRedirect を束ねる
vi.mock("next/navigation", async () => ({
  ...(await import("@/test/navigation-mock")),
  redirect: vi.fn(),
  permanentRedirect: vi.fn(),
}));

import { setPathname, setSearchParams } from "@/test/navigation-mock";

import { LOCALE_LINK_TABLE } from "./_lib/locale-link-table";
import { NavMenu } from "./nav-menu";

/** ドロワーのナビゲーション項目（言語切替を除く）の href と「日本語のみ」の有無 */
function drawerItems(
  locale: SupportedLocale,
  pathname: string,
): { href: string | null; hrefLang: string | null; japaneseOnly: boolean }[] {
  setPathname(pathname);
  setSearchParams("");
  render(<NavMenu localeLinks={{ locale, table: LOCALE_LINK_TABLE }} />);
  const nav = document.body.querySelector("nav");
  expect(nav).not.toBeNull();
  return [...(nav?.querySelectorAll("a") ?? [])].map((link) => ({
    href: link.getAttribute("href"),
    hrefLang: link.getAttribute("hrefLang"),
    japaneseOnly: (link.textContent ?? "").includes("language.japaneseOnly"),
  }));
}

describe("NavMenu", () => {
  it("日本語のページでは今までどおりの href を張り、日本語のみの印を付けない", () => {
    expect(drawerItems("ja", "/practice")).toEqual([
      { href: "/practice", hrefLang: null, japaneseOnly: false },
      { href: "/lessons", hrefLang: null, japaneseOnly: false },
      { href: "/dojo", hrefLang: null, japaneseOnly: false },
      { href: "/reference", hrefLang: null, japaneseOnly: false },
      { href: "/leaderboard", hrefLang: null, japaneseOnly: false },
      { href: "/preferences", hrefLang: null, japaneseOnly: false },
    ]);
  });

  it("英語のページでは設定も英語のページへ向け、日本語のみの印はランキングだけに残る", () => {
    expect(drawerItems("en", "/en/mypage")).toEqual([
      { href: "/en/practice", hrefLang: null, japaneseOnly: false },
      { href: "/en/lessons", hrefLang: null, japaneseOnly: false },
      { href: "/en/dojo", hrefLang: null, japaneseOnly: false },
      { href: "/en/reference", hrefLang: null, japaneseOnly: false },
      { href: "/leaderboard", hrefLang: "ja", japaneseOnly: true },
      { href: "/en/preferences", hrefLang: null, japaneseOnly: false },
    ]);
  });
});
