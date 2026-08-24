import { PRACTICE_MENU_SLUGS } from "@/lib/db/practice-menu-types";

import {
  chapterHref,
  CURRICULUM_CHAPTER_SLUGS,
} from "@/app/(user)/(public)/learn/_lib/curriculum";
import { practiceHref } from "@/app/(user)/(public)/practice/_lib/practice-catalog";

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
  { url: "/learn", changeFrequency: "weekly", priority: 0.9 },
  { url: "/practice", changeFrequency: "weekly", priority: 0.9 },
  { url: "/reference", changeFrequency: "weekly", priority: 0.8 },
  // 総合演習。slug が練習レジストリ外のため PRACTICE_SITEMAP_PATHS で導出されない
  { url: "/practice/score", changeFrequency: "monthly", priority: 0.8 },
  { url: "/reference/score-table", changeFrequency: "monthly", priority: 0.7 },
  { url: "/reference/yaku", changeFrequency: "monthly", priority: 0.7 },
  { url: "/announcements", changeFrequency: "daily", priority: 0.5 },
  { url: "/terms", changeFrequency: "yearly", priority: 0.2 },
  { url: "/privacy", changeFrequency: "yearly", priority: 0.2 },
] as const;

/** 教本章ページのパス一覧（`/learn/<slug>`） */
export const LEARN_SITEMAP_PATHS: readonly string[] =
  CURRICULUM_CHAPTER_SLUGS.map(chapterHref);

/** 練習説明ページのパス一覧（`/practice/<slug>`） */
export const PRACTICE_SITEMAP_PATHS: readonly string[] =
  PRACTICE_MENU_SLUGS.map(practiceHref);

/**
 * DB に依存しない indexable パスの全集合（トップは "/" に正規化済み）。
 * お知らせ詳細（DB 由来）は含まない。
 */
export const INDEXABLE_PATHS: readonly string[] = [
  ...STATIC_SITEMAP_ROUTE_DEFS.map((route) => route.url || "/"),
  ...LEARN_SITEMAP_PATHS,
  ...PRACTICE_SITEMAP_PATHS,
];
