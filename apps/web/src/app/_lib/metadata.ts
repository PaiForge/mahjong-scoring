import type { Metadata } from "next";

/** サイト名 */
const SITE_NAME = "Mahjong Scoring";

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
