/**
 * sitemap.xml を名前空間ごと解析する
 *
 * 文字列の正規表現ではなく XML として読み、`<url>` は sitemap の名前空間、
 * hreflang の `<xhtml:link>` は XHTML の名前空間で引く（接頭辞の名前に依らない）。
 */
import { JSDOM } from "jsdom";

/** sitemap の名前空間 */
export const SITEMAP_NS = "http://www.sitemaps.org/schemas/sitemap/0.9";
/** hreflang の `<xhtml:link>` の名前空間 */
export const XHTML_NS = "http://www.w3.org/1999/xhtml";

/** `<url>` 1 件 */
export interface SitemapEntry {
  readonly loc: string;
  readonly lastmod: string | undefined;
  readonly changefreq: string | undefined;
  readonly priority: string | undefined;
  /** hreflang → href（`<xhtml:link rel="alternate">`） */
  readonly alternates: Readonly<Record<string, string>>;
}

/** 解析の結果 */
export interface ParsedSitemap {
  readonly entries: readonly SitemapEntry[];
  /** XML として解析できなかったときの理由 */
  readonly error: string | undefined;
}

function childText(parent: Element, name: string): string | undefined {
  const [child] = parent.getElementsByTagNameNS(SITEMAP_NS, name);
  const text = child?.textContent?.trim();
  return text === "" ? undefined : text;
}

/**
 * sitemap.xml を解析する
 *
 * @param xml - sitemap.xml の本文
 */
export function parseSitemap(xml: string): ParsedSitemap {
  let document: Document;
  try {
    // jsdom は整形式でない XML を例外で返す（parsererror 要素を作るとは限らない）
    document = new JSDOM(xml, { contentType: "application/xml" }).window
      .document;
  } catch (error) {
    return { entries: [], error: String(error) };
  }
  const parserError = document.getElementsByTagName("parsererror")[0];
  if (parserError) {
    return { entries: [], error: parserError.textContent ?? "parsererror" };
  }
  const root = document.documentElement;
  if (root.namespaceURI !== SITEMAP_NS || root.localName !== "urlset") {
    return {
      entries: [],
      error: `ルート要素が sitemap の urlset ではない: {${root.namespaceURI}}${root.localName}`,
    };
  }
  const entries = [...root.getElementsByTagNameNS(SITEMAP_NS, "url")].map(
    (url): SitemapEntry => {
      const alternates: Record<string, string> = {};
      for (const link of url.getElementsByTagNameNS(XHTML_NS, "link")) {
        if (link.getAttribute("rel") !== "alternate") continue;
        alternates[link.getAttribute("hreflang") ?? ""] =
          link.getAttribute("href") ?? "";
      }
      return {
        loc: childText(url, "loc") ?? "",
        lastmod: childText(url, "lastmod"),
        changefreq: childText(url, "changefreq"),
        priority: childText(url, "priority"),
        alternates,
      };
    },
  );
  return { entries, error: undefined };
}
