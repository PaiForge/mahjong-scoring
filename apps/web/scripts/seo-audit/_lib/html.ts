/**
 * 初期 HTML（JS を実行する前の HTML）の head と本文を読む
 *
 * jsdom で解析するだけで、スクリプトは実行しない（jsdom の既定）。クローラーや
 * SNS のプレビューが JS を実行せずに見る内容を検査するため。
 *
 * 本文の所在は文字列ではなく DOM で判定する。Next は本文の **前** に空の
 * `<div hidden=""><!--$--><!--/$--></div>` を出すので、`<div hidden` の有無だけでは
 * 本文欠落を判定できない。見るのは「hidden の祖先を持たない `<main>` があり、
 * その中に空でない h1 と本文がある」こと。Suspense の境界が本文を応答末尾の
 * `<div hidden id="S:…">` に回した場合、`<main>` にはスケルトンだけが残り、
 * 本文は hidden の祖先の下にしか無いので失敗になる。
 */
import { JSDOM } from "jsdom";

/** `<link rel="alternate" hreflang>` 1 本 */
export interface HtmlAlternate {
  readonly hreflang: string;
  readonly href: string;
}

/** head から読む SEO の項目 */
export interface HtmlHead {
  readonly lang: string;
  readonly title: string;
  readonly canonicals: readonly string[];
  /** `<meta name="robots">` の content（複数あればすべて） */
  readonly robots: readonly string[];
  /** `<meta name="googlebot">` の content */
  readonly googlebot: readonly string[];
  readonly alternates: readonly HtmlAlternate[];
  /** `name` / `property` → content（description・og:*・twitter:*） */
  readonly meta: ReadonlyMap<string, string>;
  /** JSON-LD（解析できたもの） */
  readonly jsonLd: readonly unknown[];
  /** JSON-LD の解析に失敗したもの（先頭の抜粋） */
  readonly jsonLdErrors: readonly string[];
}

/** 本文の検査結果 */
export interface HtmlBody {
  /** hidden の祖先を持たない `<main>` の数 */
  readonly visibleMains: number;
  /** 文書順で最初の h1（hidden の祖先を持たないもの）の文言 */
  readonly firstVisibleH1: string | undefined;
  /** 見える `<main>` の中の、空でない h1 の数 */
  readonly mainH1s: number;
  /** 見える `<main>` の中の、見える文字数（script・style・hidden を除き、h1 を除く） */
  readonly mainTextLength: number;
  /** 見える `<main>` の文言（空白を詰めたもの） */
  readonly mainText: string;
  readonly mainTh: number;
  readonly mainTd: number;
  /** hidden の祖先の下にある h1 の文言（本文が外出しされた兆候） */
  readonly hiddenH1s: readonly string[];
  /**
   * 文書全体の、`rel` に `sponsored` を持つリンクの数（hidden の下も数える）
   *
   * ネイティブ広告のリンク（アプリの `NATIVE_AD_LINK_PROPS`）は必ず
   * `rel="sponsored …"` を持つ。広告の札の文言は言語ごとの辞書にあり監査からは
   * 知り得ないので、広告の有無はこの属性で判定する。Suspense で後から差し込む
   * 部分（hidden の下）にある広告も配信されるので数える。
   */
  readonly sponsoredLinks: number;
}

/** HTML を解析して document を返す（スクリプトは実行しない） */
export function parseHtml(html: string): Document {
  return new JSDOM(html).window.document;
}

function attr(element: Element, name: string): string {
  return element.getAttribute(name) ?? "";
}

/**
 * head の SEO 項目を読む
 *
 * @param document - {@link parseHtml} の結果
 */
export function readHead(document: Document): HtmlHead {
  const metas = [...document.querySelectorAll("meta")];
  const byName = (name: string) =>
    metas
      .filter((meta) => attr(meta, "name").toLowerCase() === name)
      .map((meta) => attr(meta, "content"));
  const meta = new Map<string, string>();
  for (const element of metas) {
    const key = attr(element, "name") || attr(element, "property");
    if (key && !meta.has(key)) meta.set(key, attr(element, "content"));
  }
  const jsonLd: unknown[] = [];
  const jsonLdErrors: string[] = [];
  for (const script of document.querySelectorAll(
    'script[type="application/ld+json"]',
  )) {
    const text = script.textContent ?? "";
    try {
      jsonLd.push(JSON.parse(text));
    } catch {
      jsonLdErrors.push(text.slice(0, 80));
    }
  }
  return {
    lang: attr(document.documentElement, "lang"),
    title: document.querySelector("head > title")?.textContent ?? "",
    canonicals: [...document.querySelectorAll('link[rel="canonical"]')].map(
      (link) => attr(link, "href"),
    ),
    robots: byName("robots"),
    googlebot: byName("googlebot"),
    alternates: [
      ...document.querySelectorAll('link[rel="alternate"][hreflang]'),
    ].map((link) => ({
      hreflang: attr(link, "hreflang"),
      href: attr(link, "href"),
    })),
    meta,
    jsonLd,
    jsonLdErrors,
  };
}

/** 要素が hidden の祖先（自身を含む）を持つか */
function isHidden(element: Element): boolean {
  return element.closest("[hidden]") !== null;
}

const ELEMENT_NODE = 1;
const TEXT_NODE = 3;

/** 見える文言に数えない要素 */
const INVISIBLE_TAGS: ReadonlySet<string> = new Set([
  "SCRIPT",
  "STYLE",
  "TEMPLATE",
  "NOSCRIPT",
]);

function isElement(node: Node): node is Element {
  return node.nodeType === ELEMENT_NODE;
}

/** 見える文言（script・style・template・noscript・hidden の子孫を除く） */
function visibleText(element: Element): string {
  const parts: string[] = [];
  const walk = (current: Node) => {
    for (const child of current.childNodes) {
      if (child.nodeType === TEXT_NODE) {
        parts.push(child.textContent ?? "");
      } else if (
        isElement(child) &&
        !INVISIBLE_TAGS.has(child.tagName.toUpperCase()) &&
        !child.hasAttribute("hidden")
      ) {
        walk(child);
      }
    }
  };
  walk(element);
  return parts.join("").replace(/\s+/g, " ").trim();
}

/**
 * 本文の所在を読む
 *
 * @param document - {@link parseHtml} の結果
 */
export function readBody(document: Document): HtmlBody {
  const mains = [...document.querySelectorAll("main")].filter(
    (main) => !isHidden(main),
  );
  const visibleH1s = [...document.querySelectorAll("h1")].filter(
    (h1) => !isHidden(h1),
  );
  let mainH1s = 0;
  let mainTextLength = 0;
  let mainTh = 0;
  let mainTd = 0;
  const texts: string[] = [];
  for (const main of mains) {
    const h1Text = [...main.querySelectorAll("h1")]
      .filter((h1) => !isHidden(h1))
      .map((h1) => visibleText(h1))
      .filter((text) => text !== "");
    mainH1s += h1Text.length;
    const text = visibleText(main);
    texts.push(text);
    mainTextLength += Math.max(
      0,
      text.length - h1Text.reduce((sum, value) => sum + value.length, 0),
    );
    mainTh += [...main.querySelectorAll("th")].filter(
      (th) => !isHidden(th),
    ).length;
    mainTd += [...main.querySelectorAll("td")].filter(
      (td) => !isHidden(td),
    ).length;
  }
  return {
    visibleMains: mains.length,
    firstVisibleH1: visibleH1s[0] ? visibleText(visibleH1s[0]) : undefined,
    mainH1s,
    mainTextLength,
    mainText: texts.join(" "),
    mainTh,
    mainTd,
    hiddenH1s: [...document.querySelectorAll("h1")]
      .filter((h1) => isHidden(h1))
      .map((h1) => (h1.textContent ?? "").trim()),
    sponsoredLinks: [...document.querySelectorAll("a[rel]")].filter((link) =>
      attr(link, "rel").toLowerCase().split(/\s+/).includes("sponsored"),
    ).length,
  };
}

/**
 * robots の指定が noindex か（複数の meta のどれかが noindex なら noindex）
 *
 * 検索エンジンは複数の robots 指定のうち最も制限の強いものを採るため。
 */
export function isNoindex(robots: readonly string[]): boolean {
  return robots.some((content) =>
    content
      .split(",")
      .map((token) => token.trim().toLowerCase())
      .some((token) => token === "noindex" || token === "none"),
  );
}

/** robots の指定に「index」（noindex ではない明示の index）が含まれるか */
export function hasExplicitIndex(robots: readonly string[]): boolean {
  return robots.some((content) =>
    content
      .split(",")
      .map((token) => token.trim().toLowerCase())
      .some((token) => token === "index"),
  );
}
