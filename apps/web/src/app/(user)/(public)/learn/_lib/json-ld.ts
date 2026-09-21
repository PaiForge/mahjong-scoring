import { OG_IMAGE, SITE_NAME } from "@/app/_lib/metadata";
import {
  buildOrganizationSchema,
  buildWebSiteRef,
} from "@/app/_lib/site-schema";
import { SITE_URL } from "@/config";

import { chapterHref, type CurriculumChapterSlug } from "./curriculum";

/**
 * 教本の章の JSON-LD（Article）を組み立てる
 * 章の構造化データ
 *
 * Article は常緑の解説ページではリッチリザルトを出さない。入れる価値は
 * 発行元と公開日をエンティティとして明示すること（E-E-A-T と鮮度）と、
 * Discover 掲載の前提を満たすことに限られる。`headline` は h1 と一致させる。
 *
 * `dateModified` は持たない — 更新日の実データが無いため。推測の日付を
 * 入れるのはガイドライン違反で、無い方がよい。
 *
 * @param params.slug 章のスラッグ
 * @param params.headline 章タイトル（h1 と同じ文字列）
 * @param params.description 章の説明（meta description と同じ）
 * @param params.publishedAt 公開日（`CURRICULUM` の `publishedAt`）
 * @param params.operatorName 運営事業者名（辞書 `company.name.value`）
 */
export function buildLearnArticleSchema({
  slug,
  headline,
  description,
  publishedAt,
  operatorName,
}: {
  readonly slug: CurriculumChapterSlug;
  readonly headline: string;
  readonly description: string;
  readonly publishedAt: string;
  readonly operatorName: string;
}) {
  const url = `${SITE_URL}${chapterHref(slug)}`;
  const organization = buildOrganizationSchema(operatorName);
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline,
    description,
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    inLanguage: "ja",
    image: [`${SITE_URL}${OG_IMAGE.url}`],
    datePublished: `${publishedAt}T00:00:00+09:00`,
    articleSection: SITE_NAME,
    author: organization,
    publisher: organization,
    isPartOf: buildWebSiteRef(),
  };
}
