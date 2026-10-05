import type { Metadata } from "next";

import { createNamespaceMetadata } from "@/app/_lib/metadata";

import { chapterHref } from "@mahjong-scoring/features/routes";
import {
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
 * @param slug - 対象章のスラッグ
 */
export async function createLearnMetadata(
  slug: CurriculumChapterSlug,
): Promise<Metadata> {
  const base = await createNamespaceMetadata(chapterNamespace(slug), {
    title: "pageTitle",
    description: "pageDescription",
    path: chapterHref(slug),
  });
  const publishedAt = getChapterBySlug(slug)?.publishedAt;
  return {
    ...base,
    // 章は読み物なので og:type は website ではなく article。公開日も添える
    // （Article の JSON-LD と同じ値。LearnPageLayout が出す）
    openGraph: {
      ...base.openGraph,
      type: "article",
      ...(publishedAt
        ? { publishedTime: `${publishedAt}T00:00:00+09:00` }
        : {}),
    },
  };
}
