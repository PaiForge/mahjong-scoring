import { siteIdentity } from "@/app/_lib/metadata";
import {
  buildOrganizationSchema,
  buildWebSiteRef,
} from "@/app/_lib/site-schema";
import { SITE_URL } from "@/config";
import { localizedHref } from "@/i18n/public-path";

import {
  DEFAULT_LOCALE,
  type SupportedLocale,
} from "@mahjong-scoring/features/i18n/locales";
import { jstDayStartIso } from "@mahjong-scoring/features/jst";
import { chapterHref } from "@mahjong-scoring/features/routes";
import type { CurriculumChapterSlug } from "@mahjong-scoring/features/curriculum/registry";

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
 * 言語（`locale`、省略時は日本語）はページの本文の言語に合わせる。`url` と
 * `mainEntityOfPage` はその言語のページ自身（英語は `/en/lessons/...`）で、
 * Article は言語ページごとに別のエンティティになる。`headline`・`description`・
 * `inLanguage`・画像・運営組織の説明もその言語にする。`datePublished` には
 * その言語のページを公開した日を渡す（英語なら翻訳の公開日。日本語の章の
 * 公開日やビルド時刻で代用しない）。
 *
 * @param params.slug 章のスラッグ
 * @param params.headline 章タイトル（h1 と同じ文字列）
 * @param params.description 章の説明（meta description と同じ）
 * @param params.publishedAt 公開日（`CURRICULUM` の `publishedAt`）
 * @param params.operatorName 運営事業者名（辞書 `company.name.value`）
 * @param params.locale ページの言語（省略時は日本語）
 */
export function buildLearnArticleSchema({
  slug,
  headline,
  description,
  publishedAt,
  operatorName,
  locale = DEFAULT_LOCALE,
}: {
  readonly slug: CurriculumChapterSlug;
  readonly headline: string;
  readonly description: string;
  readonly publishedAt: string;
  readonly operatorName: string;
  readonly locale?: SupportedLocale;
}) {
  const url = `${SITE_URL}${localizedHref(chapterHref(slug), locale)}`;
  const identity = siteIdentity(locale);
  const organization = buildOrganizationSchema(operatorName, locale);
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline,
    description,
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    inLanguage: locale,
    image: [`${SITE_URL}${identity.ogImage.url}`],
    datePublished: jstDayStartIso(publishedAt),
    articleSection: identity.name,
    author: organization,
    publisher: organization,
    isPartOf: buildWebSiteRef(),
  };
}
