import { CORPORATE_SITE_URL, SITE_URL } from "@/config";

import { OG_IMAGE, SITE_DESCRIPTION, SITE_NAME } from "./metadata";

/** Organization / WebSite の `@id`。他の構造化データから参照する */
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
 * @param operatorName 運営事業者名（辞書 `company.name.value`）
 */
export function buildOrganizationSchema(operatorName: string) {
  return {
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: SITE_NAME,
    url: SITE_URL,
    logo: {
      "@type": "ImageObject",
      url: `${SITE_URL}/logo.png`,
      width: 512,
      height: 512,
    },
    description: SITE_DESCRIPTION,
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
 * @param operatorName 運営事業者名（辞書 `company.name.value`）
 */
export function buildSiteSchema(operatorName: string) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      buildOrganizationSchema(operatorName),
      {
        "@type": "WebSite",
        "@id": WEBSITE_ID,
        url: SITE_URL,
        name: SITE_NAME,
        description: SITE_DESCRIPTION,
        inLanguage: "ja",
        image: `${SITE_URL}${OG_IMAGE.url}`,
        publisher: { "@id": ORGANIZATION_ID },
      },
    ],
  };
}

/** 教本の Article 等から `isPartOf` で指す WebSite */
export function buildWebSiteRef() {
  return {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: SITE_URL,
    name: SITE_NAME,
  } as const;
}
