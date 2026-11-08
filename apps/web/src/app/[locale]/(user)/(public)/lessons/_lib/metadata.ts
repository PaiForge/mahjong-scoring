import type { Metadata } from "next";

import {
  createNamespaceMetadata,
  type MetadataLocaleOptions,
} from "@/app/_lib/metadata";

import { DEFAULT_LOCALE } from "@mahjong-scoring/features/i18n/locales";
import { jstDayStartIso } from "@mahjong-scoring/features/jst";
import { chapterHref } from "@mahjong-scoring/features/routes";
import {
  chapterPublishedAtFor,
  getChapterBySlug,
  type CurriculumChapterSlug,
} from "@mahjong-scoring/features/curriculum/registry";
import { chapterNamespace } from "@mahjong-scoring/features/curriculum/chapter-namespace";

/**
 * 教本（learn）ページの metadata を生成する。
 * 各章は翻訳名前空間 `<camelCase(slug)>.learn` の `pageTitle` /
 * `pageDescription` を持つ前提。
 * 教本メタデータ生成
 *
 * canonical のパスと辞書ネームスペースをどちらも slug から導出する。
 * og:type は article（公開日は `CURRICULUM` の `publishedAt`）。
 *
 * `options.locale`（省略時は日本語）で辞書・canonical・OGP の言語を決める。
 * `article:published_time` はその言語のページの公開日で、日本語は
 * `CURRICULUM` の `publishedAt`、英語は `translatedAt.en`
 * （`chapterPublishedAtFor`）。英語は翻訳の公開日が記録された章だけ出し、
 * 無ければ出さない — 日本語の日付やビルド時刻で代用すると、実際と違う
 * 公開日を名乗ることになる。
 *
 * @param slug - 対象章のスラッグ
 * @param options - 言語（省略時は日本語）
 */
export async function createLearnMetadata(
  slug: CurriculumChapterSlug,
  options: MetadataLocaleOptions = {},
): Promise<Metadata> {
  const { locale = DEFAULT_LOCALE } = options;
  const base = await createNamespaceMetadata(chapterNamespace(slug), {
    title: "pageTitle",
    description: "pageDescription",
    path: chapterHref(slug),
    locale,
  });
  const chapter = getChapterBySlug(slug);
  const publishedAt = chapter && chapterPublishedAtFor(chapter, locale);
  return {
    ...base,
    // 章は読み物なので og:type は website ではなく article。公開日も添える
    // （Article の JSON-LD と同じ値。LearnPageLayout が出す）
    openGraph: {
      ...base.openGraph,
      type: "article",
      ...(publishedAt ? { publishedTime: jstDayStartIso(publishedAt) } : {}),
    },
  };
}
