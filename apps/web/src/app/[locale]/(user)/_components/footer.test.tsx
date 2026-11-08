/**
 * Footer のテスト
 *
 * フッターの言語切替は、JavaScript の無い閲覧者とクローラーに届く唯一の
 * 常設の切替（ヘッダーの切替は md 以上だけ、ドロワーはマウント後に描く）。
 * サーバー描画の HTML に素の `<a href>` で出ることを固定する。
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";

import { messages as enMessages } from "@mahjong-scoring/messages/en";
import { messages as jaMessages } from "@mahjong-scoring/messages/ja";

const { localeRef } = vi.hoisted(() => ({ localeRef: { current: "ja" } }));

vi.mock("next-intl/server", async () => ({
  ...(await import("@/test/intl-mock")),
  getLocale: () => Promise.resolve(localeRef.current),
}));
// 公開 href の表（locale-link-table）が読む next-intl のナビゲーションは、
// モジュールの評価時に redirect / permanentRedirect を束ねる
vi.mock("next/navigation", async () => ({
  ...(await import("@/test/navigation-mock")),
  redirect: vi.fn(),
  permanentRedirect: vi.fn(),
}));
vi.mock("next/link", async () => await import("@/test/next-link-mock"));
vi.mock("next/image", () => ({
  default: ({ alt }: { readonly alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} />
  ),
}));

import { setPathname, setSearchParams } from "@/test/navigation-mock";

import { Footer } from "./footer";

async function renderHtml(
  locale: "ja" | "en",
  pathname: string,
): Promise<string> {
  localeRef.current = locale;
  setPathname(pathname);
  setSearchParams("");
  const footer = await Footer();
  return renderToString(
    <NextIntlClientProvider
      locale={locale}
      messages={locale === "ja" ? jaMessages : enMessages}
    >
      {footer}
    </NextIntlClientProvider>,
  );
}

describe("Footer", () => {
  beforeEach(() => {
    localeRef.current = "ja";
  });

  it("日本語の点数表では、英語の対訳への素の <a href> をサーバー描画に含める", async () => {
    const html = await renderHtml("ja", "/reference/score-table");

    expect(html).toMatch(
      /<a href="\/en\/reference\/score-table" hrefLang="en"[^>]*>English<\/a>/,
    );
  });

  it("日本語のページのリンクは今までどおり（日本語のみの印も hrefLang も無い）", async () => {
    const html = await renderHtml("ja", "/practice");

    expect(html).toContain('href="/terms"');
    expect(html).toContain('href="/lessons/about-this-app"');
    expect(html).not.toContain('hrefLang="ja"');
    expect(html).not.toContain("language.japaneseOnly");
  });

  it("英語のページでは、英語で公開しているフッターのリンクを英語のページへ言語をまたがずに向ける", async () => {
    const html = await renderHtml("en", "/en/reference/score-table");

    // 「その他」の 5 本（利用規約・プライバシーポリシー・お問い合わせ・特商法の表記・
    // 運営者情報）は英語で公開しているので、英語のページへ印なしで向ける
    for (const path of [
      "/terms",
      "/privacy",
      "/contact",
      "/tokushoho",
      "/company",
    ]) {
      expect(html).toMatch(new RegExp(`<a href="/en${path}"(?! hrefLang)`));
      expect(html).not.toContain(`href="${path}"`);
    }
    // はじめにの章は英語で公開しているので、英語の章へ言語をまたがずに向ける
    expect(html).toMatch(
      /<a href="\/en\/lessons\/about-this-app"(?! hrefLang)/,
    );
    expect(html).not.toMatch(/href="\/lessons\/about-this-app"/);
    // 英語のトップ（/en）は公開しているので、ロゴは英語のトップへ言語をまたがずに向ける
    expect(html).toMatch(/<a href="\/en">/);
    expect(html).not.toMatch(/<a href="\/" hrefLang="ja"/);
    // 日本語へまたぐリンクは言語切替の「日本語」だけで、日本語のみの印は 1 つも無い
    expect(html.match(/hrefLang="ja"/g)).toHaveLength(1);
    expect(html).not.toContain("language.japaneseOnly");
    // 日本語への切替は /ja を経由しない
    expect(html).toMatch(
      /<a href="\/reference\/score-table" hrefLang="ja"[^>]*>日本語<\/a>/,
    );
  });
});
