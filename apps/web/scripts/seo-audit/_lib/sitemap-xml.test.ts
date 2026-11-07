import { describe, expect, it } from "vitest";

import { parseSitemap } from "./sitemap-xml";

describe("parseSitemap", () => {
  it("接頭辞の名前に依らず、名前空間で url と xhtml:link を引く", () => {
    const parsed = parseSitemap(
      '<?xml version="1.0" encoding="UTF-8"?>' +
        '<s:urlset xmlns:s="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:h="http://www.w3.org/1999/xhtml">' +
        "<s:url><s:loc>https://x/a</s:loc><s:lastmod>2026-01-01</s:lastmod>" +
        '<h:link rel="alternate" hreflang="ja" href="https://x/a"/>' +
        '<h:link rel="alternate" hreflang="x-default" href="https://x/a"/>' +
        "</s:url>" +
        "<s:url><s:loc>https://x/b</s:loc><s:priority>0.5</s:priority></s:url>" +
        "</s:urlset>",
    );
    expect(parsed.error).toBeUndefined();
    expect(parsed.entries).toEqual([
      {
        loc: "https://x/a",
        lastmod: "2026-01-01",
        changefreq: undefined,
        priority: undefined,
        alternates: { ja: "https://x/a", "x-default": "https://x/a" },
      },
      {
        loc: "https://x/b",
        lastmod: undefined,
        changefreq: undefined,
        priority: "0.5",
        alternates: {},
      },
    ]);
  });

  it("sitemap の名前空間でない urlset は失敗にする", () => {
    expect(
      parseSitemap("<urlset><url><loc>x</loc></url></urlset>").error,
    ).toMatch(/urlset ではない/);
  });

  it("壊れた XML は失敗にする", () => {
    expect(parseSitemap("<urlset").error).toBeDefined();
  });
});
