/**
 * 点数早見表のサーバー描画のテスト
 *
 * このページは検索需要が最も高く、表の数字が初期 HTML に入っていることが
 * 要件（クエリやルール設定は hydration 後に効かせる）。英語のラベルにしても
 * 数字をサーバー描画から落とさないことを、`renderToString` の HTML で固定する。
 */
import { describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";

import { messages as enMessages } from "@mahjong-scoring/messages/en";
import { messages as jaMessages } from "@mahjong-scoring/messages/ja";
import type { SupportedLocale } from "@mahjong-scoring/features/i18n/locales";

vi.mock("next/navigation", async () => await import("@/test/navigation-mock"));

import { ScoreTableFromQuery } from "./score-table-from-query";
import { fuHanHeading } from "./normal-score-table";

function renderHtml(locale: SupportedLocale): string {
  return renderToString(
    <NextIntlClientProvider
      locale={locale}
      messages={locale === "ja" ? jaMessages : enMessages}
    >
      <ScoreTableFromQuery />
    </NextIntlClientProvider>,
  );
}

describe("ScoreTableFromQuery（サーバー描画）", () => {
  it.each(["ja", "en"] as const)(
    "%s: 既定の表（子・ロン・符×翻）の点数をサーバー描画の HTML に含める",
    (locale) => {
      const html = renderHtml(locale);

      // 子ロン: 30符1翻 = 1000、40符3翻 = 5200、30符3翻 = 3900
      for (const score of ["1000", "5200", "3900"]) {
        expect(html).toContain(`>${score}<`);
      }
    },
  );

  it("英語のラベルは訳語表のとおり（親子 = dealer / non-dealer、ロン / ツモ）", () => {
    const html = renderHtml("en");

    expect(html).toContain("Non-dealer");
    expect(html).toContain("Dealer");
    expect(html).toContain("Ron");
    expect(html).toContain("Tsumo");
    // 符の列の見出しと翻の列の見出し
    expect(html).toContain("fu\\han");
    expect(html).toContain("1<!-- --> han");
  });

  it("日本語の見出しは今までどおり", () => {
    const html = renderHtml("ja");

    expect(html).toContain("符＼翻");
    expect(html).toContain("1<!-- -->翻");
  });
});

describe("fuHanHeading", () => {
  it("和文の接尾辞は全角の区切りで繋ぐ", () => {
    expect(fuHanHeading("符", "翻")).toBe("符＼翻");
  });

  it("英語の接尾辞は先頭の空白を落とし、半角の区切りで繋ぐ", () => {
    expect(fuHanHeading(" fu", " han")).toBe("fu\\han");
  });
});
