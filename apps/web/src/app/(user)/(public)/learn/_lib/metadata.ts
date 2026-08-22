import type { Metadata } from "next";

import { createNamespaceMetadata } from "@/app/_lib/metadata";

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
  return createNamespaceMetadata(namespace, {
    title: "pageTitle",
    description: "pageDescription",
  });
}
