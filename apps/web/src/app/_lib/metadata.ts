import type { Metadata } from "next";

import messages from "@/messages/ja.json";

/**
 * サイト名
 * 唯一の正典は i18n 辞書（messages/ja.json）の `metadata.siteName`。
 * タイトル・メタデータ・メールテンプレートはすべてこの名称に揃える。
 */
export const SITE_NAME = messages.metadata.siteName;

/** サイトのキャッチコピー（トップページのタイトル等に使用） */
export const SITE_TAGLINE = messages.metadata.siteTagline;

/** サイトの説明文（meta description のデフォルト） */
export const SITE_DESCRIPTION = messages.metadata.siteDescription;

/**
 * ページ用の Metadata を生成する
 * メタデータヘルパー
 */
export function createMetadata({
  title,
  description,
}: {
  readonly title: string;
  readonly description?: string;
}): Metadata {
  return {
    title: `${title} - ${SITE_NAME}`,
    ...(description ? { description } : {}),
  };
}
