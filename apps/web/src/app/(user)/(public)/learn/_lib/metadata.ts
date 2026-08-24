import type { Metadata } from "next";

import { createNamespaceMetadata } from "@/app/_lib/metadata";

import { chapterHref, type CurriculumChapterSlug } from "./curriculum";

/**
 * 教本（learn）ページの metadata を生成する。
 * 各ページは翻訳名前空間の `pageTitle` / `pageDescription` を持つ前提。
 * 教本メタデータ生成
 *
 * canonical のパスは slug から `chapterHref()` で導出する。ページ側が
 * `/learn/<slug>` を文字列で組み立てるとルート変更に追随できなくなるため。
 *
 * @param namespace - 翻訳名前空間（例: "jantouFu.learn"）
 * @param slug - 対象章のスラッグ（canonical の組み立てに使う）
 */
export async function createLearnMetadata(
  namespace: string,
  slug: CurriculumChapterSlug,
): Promise<Metadata> {
  return createNamespaceMetadata(namespace, {
    title: "pageTitle",
    description: "pageDescription",
    path: chapterHref(slug),
  });
}
