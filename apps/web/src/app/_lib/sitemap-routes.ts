import { PRACTICE_MENU_SLUGS } from "@mahjong-scoring/features/practice-menu-types";
import { GLOSSARY_TERM_SLUGS } from "@mahjong-scoring/features/glossary/registry";
import {
  GLOSSARY_PATH,
  glossaryTermHref,
} from "@mahjong-scoring/features/glossary/routes";

import { chapterHref } from "@mahjong-scoring/features/routes";
import { CURRICULUM } from "@mahjong-scoring/features/curriculum/registry";
import { practiceHref } from "@mahjong-scoring/features/routes";
import { rankHref } from "@mahjong-scoring/features/routes";
import { RANK_SLUGS } from "@mahjong-scoring/features/ranks/registry";

/**
 * sitemap の静的ルート定義
 * サイトマップ静的ルート
 *
 * `url` は SITE_URL からの相対パス（トップは ""）。sitemap.ts が
 * changeFrequency / priority ごと消費し、seo-coverage.test.ts が
 * 「掲載ページが実在し canonical を持つ」ことの検査に使う。
 * DB 由来のお知らせ詳細はここに載らない（sitemap.ts が実行時に取得する）。
 */
export const STATIC_SITEMAP_ROUTE_DEFS = [
  { url: "", changeFrequency: "weekly", priority: 1.0 },
  { url: "/getting-started", changeFrequency: "monthly", priority: 0.9 },
  { url: "/try", changeFrequency: "monthly", priority: 0.8 },
  { url: "/lessons", changeFrequency: "weekly", priority: 0.9 },
  { url: "/practice", changeFrequency: "weekly", priority: 0.9 },
  { url: "/dojo", changeFrequency: "monthly", priority: 0.8 },
  { url: "/reference", changeFrequency: "weekly", priority: 0.8 },
  // 和了形の点数計算。slug が練習レジストリ外のため PRACTICE_SITEMAP_PATHS で導出されない
  { url: "/practice/score", changeFrequency: "monthly", priority: 0.8 },
  { url: "/practice/tenpai-score", changeFrequency: "monthly", priority: 0.8 },
  { url: "/reference/score-table", changeFrequency: "monthly", priority: 0.7 },
  { url: "/reference/yaku", changeFrequency: "monthly", priority: 0.7 },
  { url: GLOSSARY_PATH, changeFrequency: "monthly", priority: 0.7 },
  { url: "/announcements", changeFrequency: "daily", priority: 0.5 },
  { url: "/leaderboard", changeFrequency: "daily", priority: 0.4 },
  { url: "/terms", changeFrequency: "yearly", priority: 0.2 },
  { url: "/privacy", changeFrequency: "yearly", priority: 0.2 },
  { url: "/contact", changeFrequency: "yearly", priority: 0.3 },
  { url: "/plan", changeFrequency: "monthly", priority: 0.6 },
  { url: "/tokushoho", changeFrequency: "yearly", priority: 0.2 },
  { url: "/company", changeFrequency: "yearly", priority: 0.2 },
] as const;

/**
 * レッスン（章）ページの sitemap 項目（`/lessons/<slug>` と最終更新日）
 *
 * `lastModified` は章の `publishedAt`。Google は sitemap の `changefreq` /
 * `priority` を無視し `lastmod` だけをクロールの手がかりにするため、実データが
 * ある章だけ付ける（静的ページに推測の日付は付けない）。
 */
export const LEARN_SITEMAP_ENTRIES: readonly {
  readonly path: string;
  readonly lastModified: string;
}[] = CURRICULUM.map((chapter) => ({
  path: chapterHref(chapter.slug),
  lastModified: chapter.publishedAt,
}));

/** レッスン（章）ページのパス一覧（`/lessons/<slug>`） */
export const LEARN_SITEMAP_PATHS: readonly string[] = LEARN_SITEMAP_ENTRIES.map(
  (entry) => entry.path,
);

/** 練習説明ページのパス一覧（`/practice/<slug>`） */
export const PRACTICE_SITEMAP_PATHS: readonly string[] =
  PRACTICE_MENU_SLUGS.map((slug) => practiceHref(slug));

/**
 * 用語ページのパス一覧（`/reference/glossary/<slug>`）
 *
 * INDEXABLE_PATHS には入れない。seo-coverage.test.ts はパスを page.tsx の
 * ディレクトリ名に突き合わせるため、動的セグメント（`[slug]`）で受ける
 * ページは解決できない（お知らせ詳細と同じ理由）。用語が辞書に揃っている
 * ことは `lib/glossary/glossary-i18n-integrity.test.ts` が別途保証する。
 */
export const GLOSSARY_SITEMAP_PATHS: readonly string[] =
  GLOSSARY_TERM_SLUGS.map(glossaryTermHref);

/**
 * 段級位の詳細ページのパス一覧（`/dojo/ranks/<slug>`）
 *
 * 用語ページと同じ理由で INDEXABLE_PATHS には入れない（動的セグメントで
 * 受けるページは seo-coverage.test.ts がディレクトリ名に解決できない）。
 */
export const RANK_SITEMAP_PATHS: readonly string[] = RANK_SLUGS.map(rankHref);

/**
 * DB に依存しない indexable パスの全集合（トップは "/" に正規化済み）。
 * お知らせ詳細（DB 由来）は含まない。
 */
export const INDEXABLE_PATHS: readonly string[] = [
  ...STATIC_SITEMAP_ROUTE_DEFS.map((route) => route.url || "/"),
  ...LEARN_SITEMAP_PATHS,
  ...PRACTICE_SITEMAP_PATHS,
];
