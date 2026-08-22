"use client";

import { usePathname } from "next/navigation";

import { PageSkeleton } from "@/app/(user)/_components/page-skeleton";
import type { PracticeMenuSlug } from "@/lib/db/practice-menu-types";
import { PracticeResultLoadingFallback } from "./practice-result-loading-fallback";

interface Props {
  /** ルートスラッグ（例: "machi-fu"）。loading.tsx を置いたディレクトリと揃える */
  readonly slug: PracticeMenuSlug;
}

/**
 * 練習ルート（`/practice/<slug>/`）共通のローディングフォールバック
 * 練習ローディング
 *
 * `/practice/<slug>/loading.tsx` は説明・play・training・result の 4 つの子スロット
 * それぞれを Suspense で包む唯一の境界になる。result へ遷移したときだけ
 * 結果ページと同じ形のスケルトンを出し、それ以外は汎用スケルトンにする。
 * 静的な説明・play・training は全体がプリフェッチされるため、通常は
 * フォールバックが表示されることはない。
 *
 * result 直下に `loading.tsx` を置かない理由は `loading-boundaries.test.ts` 参照
 * （境界が入れ子になり、プリフェッチが外側しか取らないため内側が機能しない）。
 * pathname で振り分けるためクライアントコンポーネント。
 */
export function PracticeLoading({ slug }: Props) {
  const pathname = usePathname();
  const isResult = new RegExp(`^/practice/${slug}/result/?$`).test(pathname);
  if (isResult) {
    return <PracticeResultLoadingFallback slug={slug} />;
  }
  return <PageSkeleton />;
}
