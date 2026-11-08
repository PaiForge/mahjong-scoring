import type { MetadataRoute } from "next";

import { getPublishedAnnouncementSlugsForSitemap } from "@/lib/announcements/queries";
import {
  GLOSSARY_SITEMAP_PATHS,
  LEARN_SITEMAP_ENTRIES,
  PRACTICE_SITEMAP_PATHS,
  RANK_SITEMAP_PATHS,
  STATIC_SITEMAP_ROUTE_DEFS,
} from "@/app/_lib/sitemap-routes";
import { SITE_URL } from "@/config";
import { localizedHref } from "@/i18n/public-path";
import { EN_PUBLISHED_PATHS, getPublication } from "@/i18n/route-policy";
import { getIndexableAlternates } from "@/i18n/seo-alternates";

/**
 * `/sitemap.xml` の生成
 * サイトマップ生成
 *
 * 日本語の掲載 URL・lastmod・changefreq・priority・並び順は英語の導入前と同じ
 * （`sitemap-routes.ts` と DB のお知らせから組む）。英語は、英語で
 * `published-indexable` のページだけを日本語の項目の後ろに足す。未公開・
 * noindex・404 の英語 URL は載せない。
 *
 * 各 URL の hreflang（`alternates.languages`、出力は `<xhtml:link>`）は HTML の
 * `<link rel="alternate">` と同じ `getIndexableAlternates()` から組む。sitemap と
 * HTML で別々に組むと、片方だけが 404 や noindex の相手を挙げる食い違いが
 * 起きるため。日本語だけで索引させるページは HTML と同じく `ja` と `x-default`
 * を持つ。hreflang の URL は本番の origin の絶対 URL（`loc` は `SITE_URL`）で、
 * これも HTML（canonical は `SITE_URL`、hreflang は本番）と同じ。
 *
 * lastmod は実データ（章の公開日・お知らせの公開日時）がある項目だけに付け、
 * ビルド時刻で埋めない（Google は lastmod だけをクロールの手がかりにし、
 * 毎回変わる日付は信用されなくなる）。英語の項目は日本語の同じページの
 * lastmod・changefreq・priority を引き継ぐ（同じ内容の訳なので）。
 */

/** sitemap の 1 項目を組む材料（パスはロケール非依存の日本語のパス） */
interface SitemapSource {
  readonly path: string;
  readonly lastModified?: string | Date;
  readonly changeFrequency: NonNullable<
    MetadataRoute.Sitemap[number]["changeFrequency"]
  >;
  readonly priority: number;
}

const STATIC_SOURCES: readonly SitemapSource[] = STATIC_SITEMAP_ROUTE_DEFS.map(
  ({ url, changeFrequency, priority }) => ({
    path: url || "/",
    changeFrequency,
    priority,
  }),
);

const LEARN_SOURCES: readonly SitemapSource[] = LEARN_SITEMAP_ENTRIES.map(
  ({ path, lastModified }) => ({
    path,
    lastModified,
    changeFrequency: "monthly",
    priority: 0.8,
  }),
);

const PRACTICE_SOURCES: readonly SitemapSource[] = PRACTICE_SITEMAP_PATHS.map(
  (path) => ({ path, changeFrequency: "monthly", priority: 0.8 }),
);

const GLOSSARY_SOURCES: readonly SitemapSource[] = GLOSSARY_SITEMAP_PATHS.map(
  (path) => ({ path, changeFrequency: "monthly", priority: 0.5 }),
);

const RANK_SOURCES: readonly SitemapSource[] = RANK_SITEMAP_PATHS.map(
  (path) => ({ path, changeFrequency: "monthly", priority: 0.5 }),
);

/** 英語の項目に、日本語の同じページが無いときの既定（いまは使われない） */
const EN_FALLBACK = {
  changeFrequency: "monthly",
  priority: 0.5,
} as const;

/**
 * パスを sitemap の `loc` にする（日本語のトップは末尾スラッシュ無しの origin）
 *
 * @param localizedPath - 公開 URL のパス（`/`・`/practice`・`/en/reference/score-table`）
 */
function toLoc(localizedPath: string): string {
  return localizedPath === "/" ? SITE_URL : `${SITE_URL}${localizedPath}`;
}

/**
 * 1 項目を組む（hreflang が無いページは `alternates` を付けない）
 *
 * @param source - 項目の材料
 * @param loc - 掲載する URL
 */
function toEntry(
  source: SitemapSource,
  loc: string,
): MetadataRoute.Sitemap[number] {
  const languages = getIndexableAlternates(source.path);
  return {
    url: loc,
    ...(source.lastModified === undefined
      ? {}
      : { lastModified: source.lastModified }),
    changeFrequency: source.changeFrequency,
    priority: source.priority,
    ...(Object.keys(languages).length === 0
      ? {}
      : { alternates: { languages: { ...languages } } }),
  };
}

/**
 * 日本語の項目の材料から、英語で索引させるページの項目を組む
 *
 * 英語の公開は許可リスト（`route-policy.ts`）なので有限に列挙できる。
 * 日本語の同じページの項目があれば changefreq・priority・lastmod を引き継ぐ。
 *
 * @param japanese - 日本語の項目の材料
 */
function buildEnglishSources(
  japanese: readonly SitemapSource[],
): SitemapSource[] {
  return EN_PUBLISHED_PATHS.filter(
    (path) => getPublication(path, "en") === "published-indexable",
  ).map(
    (path) =>
      japanese.find((source) => source.path === path) ?? {
        path,
        ...EN_FALLBACK,
      },
  );
}

/** `/sitemap.xml` を生成する（Next.js の `MetadataRoute.Sitemap` 規約） */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const announcementSlugs = await getPublishedAnnouncementSlugsForSitemap();

  const announcementSources: readonly SitemapSource[] = announcementSlugs.map(
    ({ slug, publishedAt }) => ({
      path: `/announcements/${slug}`,
      lastModified: publishedAt ?? undefined,
      changeFrequency: "monthly",
      priority: 0.4,
    }),
  );

  const japanese: readonly SitemapSource[] = [
    ...STATIC_SOURCES,
    ...LEARN_SOURCES,
    ...PRACTICE_SOURCES,
    ...GLOSSARY_SOURCES,
    ...RANK_SOURCES,
    ...announcementSources,
  ];

  return [
    ...japanese.map((source) => toEntry(source, toLoc(source.path))),
    ...buildEnglishSources(japanese).map((source) =>
      toEntry(source, toLoc(localizedHref(source.path, "en"))),
    ),
  ];
}
