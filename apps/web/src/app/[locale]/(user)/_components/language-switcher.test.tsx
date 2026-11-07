/**
 * LanguageSwitcher のテスト
 *
 * サーバー描画の HTML（`renderToString`）で見る。切替は JavaScript が無くても
 * 動く素の `<a href>` でなければならず、hydration 後にだけ現れるリンクでは
 * クローラーも JS 無効の閲覧者も辿れないため。
 */
import { describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";

import { messages as enMessages } from "@mahjong-scoring/messages/en";
import { messages as jaMessages } from "@mahjong-scoring/messages/ja";
import type { SupportedLocale } from "@mahjong-scoring/features/i18n/locales";

// 公開 href の表（locale-link-table）が読む next-intl のナビゲーションは、
// モジュールの評価時に redirect / permanentRedirect を束ねる
vi.mock("next/navigation", async () => ({
  ...(await import("@/test/navigation-mock")),
  redirect: vi.fn(),
  permanentRedirect: vi.fn(),
}));

import { setPathname, setSearchParams } from "@/test/navigation-mock";

import { LOCALE_LINK_TABLE } from "./_lib/locale-link-table";
import { LanguageSwitcher } from "./language-switcher";

function renderHtml(
  locale: SupportedLocale,
  pathname: string,
  variant: "inline" | "stacked" = "inline",
  query = "",
): string {
  setPathname(pathname);
  setSearchParams(query);
  return renderToString(
    <NextIntlClientProvider
      locale={locale}
      messages={locale === "ja" ? jaMessages : enMessages}
    >
      <LanguageSwitcher
        localeLinks={{ locale, table: LOCALE_LINK_TABLE }}
        variant={variant}
      />
    </NextIntlClientProvider>,
  );
}

describe("LanguageSwitcher", () => {
  it("日本語の点数表では、英語の対訳への通常の <a href> を初期 HTML に出す", () => {
    const html = renderHtml("ja", "/reference/score-table");

    expect(html).toMatch(
      /<a href="\/en\/reference\/score-table" hrefLang="en" lang="en"[^>]*>English<\/a>/,
    );
    expect(html).toContain('aria-current="true"');
  });

  it("英語の点数表では、/ja を経由しない日本語への <a href> を出す", () => {
    const html = renderHtml("en", "/en/reference/score-table");

    expect(html).toMatch(
      /<a href="\/reference\/score-table" hrefLang="ja" lang="ja"[^>]*>日本語<\/a>/,
    );
    expect(html).not.toContain('href="/ja');
  });

  it("対訳の無いページでは英語をリンクにせず、英語版が無いと示す", () => {
    const html = renderHtml("ja", "/practice");

    expect(html).not.toContain("<a ");
    expect(html).toContain("このページの英語版はありません");
  });

  it.each(["inline", "stacked"] as const)(
    "%s でも英語版が無いことは読み上げと title だけで示し、見える文を足さない",
    (variant) => {
      const html = renderHtml("ja", "/practice", variant);

      expect(html).not.toMatch(/<p[^>]*>このページの英語版はありません<\/p>/);
      expect(html).toContain('title="このページの英語版はありません"');
      expect(html).toMatch(
        /<span class="sr-only"> このページの英語版はありません<\/span>/,
      );
    },
  );

  it("注目セルの query は引き継ぎ、認証の値は写さない", () => {
    const html = renderHtml(
      "ja",
      "/reference/score-table",
      "inline",
      "role=oya&han=3&code=secret",
    );

    expect(html).toContain(
      'href="/en/reference/score-table?role=oya&amp;han=3"',
    );
    expect(html).not.toContain("secret");
  });
});
