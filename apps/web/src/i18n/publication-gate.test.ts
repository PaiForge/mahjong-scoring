/// <reference types="node" />
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { MOBILE_WEB_PAGES } from "@mahjong-scoring/features/i18n/web-locale-path";
import { messages as enMessages } from "@mahjong-scoring/messages/en";
import {
  EN_NOT_FOUND_NAMESPACES,
  EN_ROUTE_NAMESPACES,
  EN_TRANSLATED_NAMESPACES,
} from "@mahjong-scoring/messages/translation-status";
import { describe, expect, it } from "vitest";

import { collectPages } from "@/test/collect-pages";

import { EN_PUBLISHED_PATHS, getPublication } from "./route-policy";
import {
  translatedPublishedTemplates,
  translatedTemplateOf,
} from "./translated-publications";

/**
 * 英語の公開の関所と、ページの入口のロケール確定を検査する
 *
 * 1. 英語で公開するルート（`route-policy.ts` の許可リスト）と、英語ルートの依存
 *    名前空間（`translation-status.ts` の `EN_ROUTE_NAMESPACES`）が同じ集合で、
 *    依存がすべて完訳であること。英語の辞書は完訳の名前空間しか持たず日本語へ
 *    fallback しないので、未訳の名前空間を読むルートを公開すると画面に辞書キーが出る。
 *    動的ルート（用語のページ・段級位の詳細）は、具体的なパス（`/reference/glossary/jantou`）を
 *    ページのテンプレート（`/reference/glossary/[slug]`）へ畳んでから比べる。
 *    依存の表はテンプレートで 1 行、page.tsx もテンプレートで 1 つだから。具体的なパスへ
 *    展開しないテンプレート（DB 由来のお知らせの詳細）も公開の単位なので、許可リストの
 *    テンプレートそのものも単位に含める
 * 2. `app/[locale]/(user)` の全 page.tsx が、ページ本体と `generateMetadata` の両方で
 *    `prepareRouteLocale` を自分のパスで呼ぶこと。呼ばないページは未訳の英語を
 *    描画前に止められず、翻訳の前にロケールが確定しないので静的生成も失う
 * 3. アプリ（iOS）がブラウザで開く web のページ（features の `MOBILE_WEB_PAGES`）が
 *    英語で公開済み（`published-indexable`）であること。アプリは英語の端末で
 *    `webLocalePath` により `/en/...` を開き、web の公開状態の表を知らない。
 *    閉じた集合なのでここで固定すれば、英語の公開を外したときにアプリのリンクが
 *    404 になるのを統合前に止められる
 */

const APP_DIR = join(dirname(fileURLToPath(import.meta.url)), "../app");
const LOCALE_SEGMENT = "/[locale]";

/** `app/[locale]` 配下のページ（ロケール非依存のパスのテンプレート → ファイル） */
const localePages: ReadonlyMap<string, string> = new Map(
  [...collectPages(APP_DIR)]
    .filter(([urlPath]) => urlPath.startsWith(LOCALE_SEGMENT))
    .map(([urlPath, file]) => [
      urlPath.slice(LOCALE_SEGMENT.length) || "/",
      file,
    ]),
);

/**
 * `prepareRouteLocale(<params>, <パス>)` の第 2 引数を、ページのテンプレートの形
 * （`${slug}` → `[x]`）にして返す。文字列リテラル・テンプレートリテラル以外の
 * 引数（変数）は検査できないので `undefined` にする（テストが落ちる）。
 */
function routeLocalePaths(source: string): (string | undefined)[] {
  return [
    ...source.matchAll(/prepareRouteLocale\(\s*\w+\s*,\s*([^)]*?)\s*,?\s*\)/g),
  ].map((match) => {
    const literal = /^"([^"]*)"$/.exec(match[1]);
    if (literal) return literal[1];
    const template = /^`([^`]*)`$/.exec(match[1]);
    if (template) return template[1].replace(/\$\{[^}]+\}/g, "[x]");
    return undefined;
  });
}

/** ページのテンプレートの動的セグメント（`[slug]`）を `[x]` にそろえる */
function normalizeTemplate(template: string): string {
  return template.replace(/\[[^\]]+\]/g, "[x]");
}

/**
 * 関数の宣言から次のトップレベルの宣言の手前までを切り出す（粗い切り出し。
 * page.tsx はトップレベルの宣言が `export` か `const` / `function` で始まる）
 */
function declarationBody(source: string, head: RegExp): string | undefined {
  const start = source.search(head);
  if (start === -1) return undefined;
  const rest = source.slice(start + 1);
  const next = rest.search(/\n(?:export |const |async function |function )/);
  return next === -1 ? rest : rest.slice(0, next);
}

/**
 * 英語で公開する具体的なパスを、公開の単位（ページのテンプレート）へ畳む
 *
 * 許可リストの完全一致の行はそのまま、テンプレートに当たるパスはテンプレートにする。
 */
function publicationUnitOf(path: string): string {
  return translatedTemplateOf(path, "en") ?? path;
}

/**
 * 英語で公開する単位（重複を除いた、ページのテンプレートの集合）
 *
 * 展開しないテンプレート（`/announcements/[slug]`）は具体的なパスを持たないので、
 * 許可リストのテンプレートを直接足す。
 */
const EN_PUBLISHED_UNITS: readonly string[] = [
  ...new Set([
    ...EN_PUBLISHED_PATHS.map(publicationUnitOf),
    ...translatedPublishedTemplates("en"),
  ]),
];

describe("英語の公開の関所", () => {
  it("英語で公開するルートと、英語ルートの依存名前空間の表が同じ集合（テンプレートへ畳んで比べる）", () => {
    expect([...EN_PUBLISHED_UNITS].sort()).toEqual(
      Object.keys(EN_ROUTE_NAMESPACES).sort(),
    );
  });

  it("用語のページは 1 つのテンプレートに畳まれる（具体的なパスを依存の表に並べない）", () => {
    expect(EN_PUBLISHED_UNITS).toContain("/reference/glossary/[slug]");
    expect(
      EN_PUBLISHED_UNITS.filter((unit) =>
        unit.startsWith("/reference/glossary/"),
      ),
    ).toEqual(["/reference/glossary/[slug]"]);
  });

  it("段級位の詳細は 1 つのテンプレートに畳まれる（6 級を依存の表に並べない）", () => {
    expect(EN_PUBLISHED_UNITS).toContain("/dojo/ranks/[slug]");
    expect(
      EN_PUBLISHED_UNITS.filter((unit) => unit.startsWith("/dojo/ranks/")),
    ).toEqual(["/dojo/ranks/[slug]"]);
  });

  it("お知らせの詳細は具体的なパスへ展開しないが、テンプレートで公開の単位になる", () => {
    expect(
      EN_PUBLISHED_PATHS.filter((path) => path.startsWith("/announcements/")),
    ).toEqual([]);
    expect(EN_PUBLISHED_UNITS).toContain("/announcements/[slug]");
  });

  it.each(Object.entries(EN_ROUTE_NAMESPACES))(
    "%s が読む名前空間はすべて英語で完訳（英語の辞書にある）",
    (_path, namespaces) => {
      const translated = new Set<string>(EN_TRANSLATED_NAMESPACES);
      const bundled = new Set(Object.keys(enMessages));
      expect(namespaces.filter((ns) => !translated.has(ns))).toEqual([]);
      expect(namespaces.filter((ns) => !bundled.has(ns))).toEqual([]);
    },
  );

  it("英語の 404 が読む名前空間は英語の辞書にある", () => {
    const bundled = new Set(Object.keys(enMessages));
    expect(EN_NOT_FOUND_NAMESPACES.filter((ns) => !bundled.has(ns))).toEqual(
      [],
    );
  });

  it.each(EN_PUBLISHED_UNITS.map((unit) => [unit]))(
    "英語で公開する %s は app/[locale] に実在するページ",
    (unit) => {
      expect(localePages.has(unit)).toBe(true);
    },
  );
});

describe("ページの入口のロケール確定", () => {
  it("app/[locale] のページが見つかる（テスト自体の健全性）", () => {
    expect(localePages.size).toBeGreaterThan(100);
  });

  it.each([...localePages].map(([template, file]) => [template, file]))(
    "%s はページ本体で自分のパスを prepareRouteLocale に渡す",
    (template, file) => {
      const source = readFileSync(file, "utf8");
      const body = declarationBody(source, /\nexport default /);
      expect(body).toBeDefined();
      expect(routeLocalePaths(body ?? "")).toContain(
        normalizeTemplate(template),
      );
    },
  );

  it.each([...localePages].map(([template, file]) => [template, file]))(
    "%s は generateMetadata でも（持つなら）自分のパスを prepareRouteLocale に渡す",
    (template, file) => {
      const source = readFileSync(file, "utf8");
      const body = declarationBody(
        source,
        /\nexport (?:async )?function generateMetadata\b/,
      );
      if (body === undefined) return;
      expect(routeLocalePaths(body)).toContain(normalizeTemplate(template));
    },
  );

  it.each([...localePages].map(([template, file]) => [template, file]))(
    "%s の prepareRouteLocale はすべて自分のパスを渡す（別ページのパスの写し間違いがない）",
    (template, file) => {
      const paths = routeLocalePaths(readFileSync(file, "utf8"));
      expect(paths.length).toBeGreaterThan(0);
      expect(
        paths.filter((path) => path !== normalizeTemplate(template)),
      ).toEqual([]);
    },
  );
});

describe("アプリが開く web のページ", () => {
  it.each(MOBILE_WEB_PAGES.map((path) => [path]))(
    "アプリがブラウザで開く web のページは英語で公開済み（%s が published-indexable）",
    (path) => {
      expect(getPublication(path, "en")).toBe("published-indexable");
    },
  );
});
