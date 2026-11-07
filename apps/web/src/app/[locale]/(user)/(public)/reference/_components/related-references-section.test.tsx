import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";

const { localeRef } = vi.hoisted(() => ({ localeRef: { current: "ja" } }));

vi.mock("next-intl/server", async () => ({
  ...(await import("@/test/intl-mock")),
  getLocale: () => Promise.resolve(localeRef.current),
}));
vi.mock("next/link", async () => await import("@/test/next-link-mock"));

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
  });

  it("日本語のページでは今までどおりの行を出す", async () => {
    const html = await renderHtml("ja");

    expect(html).toContain('href="/reference/yaku"');
    expect(html).toContain('href="/reference/glossary"');
    expect(html).not.toContain("hrefLang");
    expect(html).not.toContain("language.japaneseOnly");
  });

  it("英語のページでは英語版の無い早見表を日本語へ向け、日本語のみと示す（/en を作らない）", async () => {
    const html = await renderHtml("en");

    expect(html).toMatch(/<a href="\/reference\/yaku" hrefLang="ja"/);
    expect(html).toMatch(/<a href="\/reference\/glossary" hrefLang="ja"/);
    expect(html).not.toContain('href="/en/');
    expect(html.match(/language\.japaneseOnly/g)).toHaveLength(2);
  });
});
