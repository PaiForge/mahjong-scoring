import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";

import type { LocaleLinkTable } from "@/app/[locale]/(user)/_components/_lib/locale-links";

const { localeRef, tableRef } = vi.hoisted(() => ({
  localeRef: { current: "ja" },
  /** 公開 href の表の差し替え（undefined なら実際の表） */
  tableRef: { current: undefined as LocaleLinkTable | undefined },
}));

vi.mock("next-intl/server", async () => ({
  ...(await import("@/test/intl-mock")),
  getLocale: () => Promise.resolve(localeRef.current),
}));
vi.mock("next/link", async () => await import("@/test/next-link-mock"));
// 早見表の 3 つ（点数表・役一覧・用語集）はどれも英語で公開しているので、
// 英語版の無い早見表の行は実際の表では作れない。その行の描き方を確かめる
// テストだけ、表を絞って渡す
vi.mock(
  "@/app/[locale]/(user)/_components/_lib/locale-link-table",
  async (importOriginal) => {
    const actual =
      await importOriginal<
        typeof import("@/app/[locale]/(user)/_components/_lib/locale-link-table")
      >();
    return {
      ...actual,
      getLocaleLinks: async () =>
        tableRef.current === undefined
          ? actual.getLocaleLinks()
          : { locale: localeRef.current, table: tableRef.current },
    };
  },
);

import { RelatedReferencesSection } from "./related-references-section";

async function renderHtml(locale: "ja" | "en"): Promise<string> {
  localeRef.current = locale;
  return renderToString(
    await RelatedReferencesSection({ current: "scoreTable" }),
  );
}

describe("RelatedReferencesSection", () => {
  beforeEach(() => {
    localeRef.current = "ja";
    tableRef.current = undefined;
  });

  it("日本語のページでは今までどおりの行を出す", async () => {
    const html = await renderHtml("ja");

    expect(html).toContain('href="/reference/yaku"');
    expect(html).toContain('href="/reference/glossary"');
    expect(html).not.toContain("hrefLang");
    expect(html).not.toContain("language.japaneseOnly");
  });

  it("英語のページでは英語版のある早見表（役一覧・用語集）を英語の対訳へ向け、日本語のみの印を付けない", async () => {
    const html = await renderHtml("en");

    expect(html).toContain('href="/en/reference/yaku"');
    expect(html).toContain('href="/en/reference/glossary"');
    expect(html).not.toContain('hrefLang="ja"');
    expect(html).not.toContain("language.japaneseOnly");
  });

  it("英語のページでは英語版の無い早見表を日本語へ向け、日本語のみと示す（/en を作らない）", async () => {
    // 役一覧・用語集が英語で未公開だったときの表（英語で出しているのは点数表だけ）
    tableRef.current = {
      "/reference/score-table": {
        ja: "/reference/score-table",
        en: "/en/reference/score-table",
      },
    };
    const html = await renderHtml("en");

    expect(html).toMatch(/<a href="\/reference\/yaku" hrefLang="ja"/);
    expect(html).toMatch(/<a href="\/reference\/glossary" hrefLang="ja"/);
    expect(html).not.toContain('href="/en/');
    expect(html.match(/language\.japaneseOnly/g)).toHaveLength(2);
  });
});
