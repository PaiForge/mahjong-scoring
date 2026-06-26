import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { createMetadata } from "@/app/_lib/metadata";

/**
 * 教本（learn）ページの metadata を生成する。
 * 各ページは翻訳名前空間の `pageTitle` / `pageDescription` を持つ前提。
 * 教本メタデータ生成
 *
 * @param namespace - 翻訳名前空間（例: "jantouFu.learn"）
 */
export async function createLearnMetadata(
  namespace: string,
): Promise<Metadata> {
  const t = await getTranslations(namespace);
  return createMetadata({
    title: t("pageTitle"),
    description: t("pageDescription"),
  });
}
