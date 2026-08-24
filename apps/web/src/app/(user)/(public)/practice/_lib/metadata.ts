import type { Metadata } from "next";

import { createNamespaceMetadata } from "@/app/_lib/metadata";
import type { PracticeMenuSlug } from "@/lib/db/practice-menu-types";

import { practiceHref } from "./practice-catalog";

/**
 * 練習の説明ページ（`/practice/<slug>`）の metadata を生成する。
 * 練習メタデータ生成
 *
 * canonical を持つのは説明ページだけ。play / result / training は
 * 検索結果に載せないため、このヘルパーを使わない。
 *
 * @param namespace - 翻訳名前空間（例: "jantouFu"）
 * @param slug - 練習のスラッグ（canonical の組み立てに使う）
 */
export async function createPracticeMetadata(
  namespace: string,
  slug: PracticeMenuSlug,
): Promise<Metadata> {
  return createNamespaceMetadata(namespace, { path: practiceHref(slug) });
}
