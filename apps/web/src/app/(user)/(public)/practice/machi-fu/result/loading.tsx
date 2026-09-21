import { PRACTICE_SLUG } from "@/lib/db/practice-menu-types";
import { PracticeResultLoadingFallback } from "@/app/(user)/(public)/practice/_components/practice-result-loading-fallback";

/**
 * 結果ページの読み込み中スケルトン。slug は親ディレクトリの page.tsx と揃える。
 * 結果ページは URL のクエリを読む動的ルートなので境界を持つ（説明 / play / training は
 * 静的で境界を持たない。`loading-boundaries.test.ts` 参照）。
 */
export default function Loading() {
  return <PracticeResultLoadingFallback slug={PRACTICE_SLUG.machiFu} />;
}
