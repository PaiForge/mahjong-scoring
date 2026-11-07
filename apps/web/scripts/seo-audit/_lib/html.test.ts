import { describe, expect, it } from "vitest";

import {
  hasExplicitIndex,
  isNoindex,
  parseHtml,
  readBody,
  readHead,
} from "./html";

/** Next が本文の前に出す空の Suspense の殻 */
const EMPTY_HIDDEN_SHELL = '<div hidden=""><!--$--><!--/$--></div>';

describe("readBody（初期 HTML の本文の所在）", () => {
  it("本文の前に空の hidden の殻があっても、見える main の h1 と本文を数える", () => {
    const body = readBody(
      parseHtml(
        `<html><body>${EMPTY_HIDDEN_SHELL}<main><h1>点数早見表</h1><p>${"本文".repeat(30)}</p></main></body></html>`,
      ),
    );
    expect(body.visibleMains).toBe(1);
    expect(body.mainH1s).toBe(1);
    expect(body.firstVisibleH1).toBe("点数早見表");
    expect(body.mainTextLength).toBe(60);
  });

  it("本文が末尾の hidden に回り main にスケルトンだけがあると、h1 も本文も数えない", () => {
    const body = readBody(
      parseHtml(
        `<html><body><main><!--$?--><template id="B:0"></template><div class="animate-pulse"></div><!--/$--></main>` +
          `<div hidden id="S:0"><h1>点数早見表</h1><p>${"本文".repeat(30)}</p></div></body></html>`,
      ),
    );
    expect(body.mainH1s).toBe(0);
    expect(body.mainTextLength).toBe(0);
    expect(body.hiddenH1s).toEqual(["点数早見表"]);
  });

  it("空の h1 が本物より先にあると、最初の h1 は空になる", () => {
    const body = readBody(
      parseHtml(
        "<html><body><main><h1></h1><h1>本物</h1></main></body></html>",
      ),
    );
    expect(body.firstVisibleH1).toBe("");
    expect(body.mainH1s).toBe(1);
  });

  it("script（JSON-LD 等）の中身は本文に数えない", () => {
    const body = readBody(
      parseHtml(
        '<html><body><main><h1>見出し</h1><script type="application/ld+json">{"a":"とても長い構造化データ"}</script></main></body></html>',
      ),
    );
    expect(body.mainTextLength).toBe(0);
  });

  it("hidden の祖先を持つ main は見える main に数えない", () => {
    const body = readBody(
      parseHtml(
        "<html><body><div hidden><main><h1>x</h1></main></div></body></html>",
      ),
    );
    expect(body.visibleMains).toBe(0);
  });

  it("main の中の表の th / td を数える", () => {
    const body = readBody(
      parseHtml(
        "<html><body><main><table><tr><th>符</th><th>1翻</th></tr><tr><td>30</td><td>1000</td></tr></table></main></body></html>",
      ),
    );
    expect([body.mainTh, body.mainTd]).toEqual([2, 2]);
  });
});

describe("readHead", () => {
  it("canonical・robots・hreflang・og・JSON-LD を読む", () => {
    const head = readHead(
      parseHtml(
        '<html lang="en"><head><title>T</title>' +
          '<link rel="canonical" href="https://x/en/a"/>' +
          '<meta name="robots" content="index, follow"/>' +
          '<link rel="alternate" hrefLang="ja" href="https://x/a"/>' +
          '<meta property="og:url" content="https://x/en/a"/>' +
          '<script type="application/ld+json">{"@type":"Thing"}</script>' +
          '<script type="application/ld+json">{broken</script>' +
          "</head><body></body></html>",
      ),
    );
    expect(head.lang).toBe("en");
    expect(head.canonicals).toEqual(["https://x/en/a"]);
    expect(head.robots).toEqual(["index, follow"]);
    expect(head.alternates).toEqual([{ hreflang: "ja", href: "https://x/a" }]);
    expect(head.meta.get("og:url")).toBe("https://x/en/a");
    expect(head.jsonLd).toEqual([{ "@type": "Thing" }]);
    expect(head.jsonLdErrors).toHaveLength(1);
  });
});

describe("isNoindex / hasExplicitIndex", () => {
  it("どれか 1 本が noindex なら noindex（最も制限の強い指定が勝つ）", () => {
    expect(isNoindex(["index, follow", "noindex"])).toBe(true);
    expect(isNoindex(["none"])).toBe(true);
    expect(isNoindex(["index, follow"])).toBe(false);
    expect(isNoindex([])).toBe(false);
  });

  it("noindex と index の併記を見分ける", () => {
    expect(hasExplicitIndex(["noindex", "index, follow"])).toBe(true);
    expect(hasExplicitIndex(["noindex, nofollow"])).toBe(false);
  });
});
