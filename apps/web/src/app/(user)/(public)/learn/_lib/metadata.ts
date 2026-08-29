import type { Metadata } from "next";

import { createNamespaceMetadata } from "@/app/_lib/metadata";

import { chapterHref, type CurriculumChapterSlug } from "./curriculum";

/**
 * 章ページの辞書ネームスペースを slug から導出する。
 * 章ネームスペース導出
 *
 * 章の辞書は「camelCase(slug) + ".learn"」に置く規約
 * （例: `jantou-fu` → `jantouFu.learn`）。ページ側が namespace と slug を
 * 別々に渡すと、コピペで「タイトルは面子・canonical は待ち」のような
 * 誤配線が typecheck を通ってしまうため、対応をここで一元化する。
 * 規約から外れた辞書名を使うと next-intl が MISSING_MESSAGE を投げるので
 * ずれは実行時に即座に発覚する。
 *
 * metadata と本文の両方がここを通る。章ページが namespace を書き起こす
 * 経路を残さないこと（残した瞬間に上記の誤配線が再び可能になる）。
 *
 * @param slug 対象章のスラッグ
 */
export function chapterNamespace(slug: CurriculumChapterSlug): string {
  const camel = slug.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
  return `${camel}.learn`;
}

/**
 * 教本（learn）ページの metadata を生成する。
 * 各章は翻訳名前空間 `<camelCase(slug)>.learn` の `pageTitle` /
 * `pageDescription` を持つ前提。
 * 教本メタデータ生成
 *
 * canonical のパスと辞書ネームスペースをどちらも slug から導出する。
 *
 * @param slug - 対象章のスラッグ
 */
export async function createLearnMetadata(
  slug: CurriculumChapterSlug,
): Promise<Metadata> {
  return createNamespaceMetadata(chapterNamespace(slug), {
    title: "pageTitle",
    description: "pageDescription",
    path: chapterHref(slug),
  });
}
