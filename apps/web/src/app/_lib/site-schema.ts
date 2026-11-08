import { CORPORATE_SITE_URL, SITE_URL } from "@/config";

import {
  DEFAULT_LOCALE,
  type SupportedLocale,
} from "@mahjong-scoring/features/i18n/locales";

import { siteIdentity } from "./metadata";

/**
 * Organization / WebSite の `@id`。他の構造化データから参照する
 *
 * 言語で変えない。日本語のページも英語のページも同じ 1 つの運営組織・
 * 1 つのサイトを指し、言語ごとに別のエンティティを作らない（`@id` が割れると
 * 検索側は別の組織・別のサイトとして扱う）。既存の日本語の `@id` も変えない。
 * 言語ごとに変わるのは説明などのテキストと `inLanguage` だけで、ページ単位の
 * エンティティ（Article・DefinedTerm）の URL は言語ページごとに別になる。
 */
const ORGANIZATION_ID = `${SITE_URL}/#organization`;
const WEBSITE_ID = `${SITE_URL}/#website`;

/**
 * サイトを運営する Organization（構造化データ）
 * 運営組織スキーマ
 *
 * 教本の Article の `author` / `publisher` からも同じ形で参照するため、
 * ここで 1 つに組み立てる。Google はページ単位で構造化データを解釈するので、
 * `@id` だけの参照では解決されない — 各ページにインラインで展開すること。
 *
 * `@id`・名前・URL・ロゴは言語で変えず、説明だけをページの言語にする
 * （見えている本文と同じ言語のテキストを載せる）。
 *
 * @param operatorName 運営事業者名（辞書 `company.name.value`）
 * @param locale ページの言語（省略時は日本語）
 */
export function buildOrganizationSchema(
  operatorName: string,
  locale: SupportedLocale = DEFAULT_LOCALE,
) {
  const identity = siteIdentity(locale);
  return {
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: identity.name,
    url: SITE_URL,
    logo: {
      "@type": "ImageObject",
      url: `${SITE_URL}/logo.png`,
      width: 512,
      height: 512,
    },
    description: identity.description,
    parentOrganization: {
      "@type": "Organization",
      name: operatorName,
      url: CORPORATE_SITE_URL,
    },
  } as const;
}

/**
 * トップページに出す Organization + WebSite の JSON-LD
 * サイトスキーマ
 *
 * Google の検索結果に出るサイト名とロゴはこの 2 型を根拠に決まる。ドメインが
 * `score.mahjong.help` というサブドメインなので、サイト名が意図せず解釈される
 * のを防ぐ。`SearchAction`（サイトリンク検索ボックス）は 2024-11 に廃止済みで
 * 入れない。
 *
 * WebSite は言語をまたいで同じサイト（`@id`・`url`・名前は同一）。説明・
 * `inLanguage`・画像だけをページの言語にする。
 *
 * @param operatorName 運営事業者名（辞書 `company.name.value`）
 * @param locale ページの言語（省略時は日本語）
 */
export function buildSiteSchema(
  operatorName: string,
  locale: SupportedLocale = DEFAULT_LOCALE,
) {
  const identity = siteIdentity(locale);
  return {
    "@context": "https://schema.org",
    "@graph": [
      buildOrganizationSchema(operatorName, locale),
      {
        "@type": "WebSite",
        "@id": WEBSITE_ID,
        url: SITE_URL,
        name: identity.name,
        description: identity.description,
        inLanguage: locale,
        image: `${SITE_URL}${identity.ogImage.url}`,
        publisher: { "@id": ORGANIZATION_ID },
      },
    ],
  };
}

/**
 * 教本の Article 等から `isPartOf` で指す WebSite
 *
 * 言語に依らない（`@id`・URL・名前だけを持ち、言語ごとのテキストを持たない）。
 */
export function buildWebSiteRef() {
  return {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: SITE_URL,
    name: siteIdentity(DEFAULT_LOCALE).name,
  } as const;
}
