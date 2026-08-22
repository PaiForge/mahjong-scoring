"use client";

import { usePathname } from "next/navigation";

import { LearnChapterSkeleton } from "./learn-chapter-skeleton";
import { LearnIndexSkeleton } from "./learn-index-skeleton";

/**
 * 教本ルート（`/learn` 配下）共通のローディングフォールバック
 * 教本ローディング
 *
 * `learn/loading.tsx` は目次（`/learn`）と各章（`/learn/<slug>`）の両方を受ける
 * 唯一の境界になる（境界はページごとに 1 つ。`loading-boundaries.test.ts` 参照）。
 * 目次（`LearnIndexSkeleton`）と章（`LearnChapterSkeleton`）ではレイアウトが
 * 違うため pathname で振り分ける。そのためクライアントコンポーネントにしている
 * （`PracticeLoading` と同じ形）。
 */
export function LearnLoading() {
  const pathname = usePathname();
  const isIndex = /^\/learn\/?$/.test(pathname);
  return isIndex ? <LearnIndexSkeleton /> : <LearnChapterSkeleton />;
}
