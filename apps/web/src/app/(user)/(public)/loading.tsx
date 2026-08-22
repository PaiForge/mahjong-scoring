"use client";

import { usePathname } from "next/navigation";

import { resolveLoadingFallback } from "./_lib/resolve-loading-fallback";

/**
 * 公開領域の唯一のローディング境界。
 * ローディング
 *
 * pathname に応じて `resolveLoadingFallback` がルートごとのスケルトンを返す。
 * 配下に `loading.tsx` を置かないこと（境界が入れ子になり、個別スケルトンが
 * 機能しなくなる。詳細は resolver の TSDoc と `loading-boundaries.test.ts`）。
 * 境界のフォールバックは同期でなければならないため `headers()` は使えず、
 * クライアントの `usePathname()` で振り分ける（blindfold-chess の
 * `(protected)/loading.tsx` と同じ構成）。
 */
export default function PublicLoading() {
  return resolveLoadingFallback(usePathname());
}
