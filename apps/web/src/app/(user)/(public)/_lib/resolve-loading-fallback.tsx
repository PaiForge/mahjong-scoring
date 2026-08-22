import type { ReactElement } from "react";

import { PageSkeleton } from "@/app/(user)/_components/page-skeleton";
import { isPracticeMenuSlug } from "@/lib/db/practice-menu-types";

import { LeaderboardDetailSkeleton } from "../leaderboard/[period]/[module]/_components/leaderboard-detail-skeleton";
import { PracticeResultLoadingFallback } from "../practice/_components/practice-result-loading-fallback";
import { PublicProfileSkeleton } from "../u/[username]/_components/public-profile-skeleton";

const PRACTICE_RESULT_PATTERN = /^\/practice\/([^/]+)\/result\/?$/;
const LEADERBOARD_DETAIL_PATTERN = /^\/leaderboard\/[^/]+\/[^/]+\/?$/;
const PUBLIC_PROFILE_PATTERN = /^\/u\/[^/]+\/?$/;

/**
 * pathname から、読み込み中のルートに合ったスケルトンを選ぶ。
 * ローディングフォールバック解決
 *
 * 公開領域の `loading.tsx` はこの 1 枚だけ（`(public)/loading.tsx`）。
 * 個別ルートに `loading.tsx` を置くと Suspense 境界が入れ子になり、
 * `<Link>` のプリフェッチは最も外側の境界までしか取らないため、クリック直後は
 * 外側の汎用スケルトンが出て、個別のスケルトンは「速いサーバでは一度も出ない /
 * 遅いサーバでは本文直前に一瞬だけ出る」状態になる（2026-08 に実測）。
 * 忠実なスケルトンが必要なルートは、`loading.tsx` を置くのではなくここに
 * エントリを足す。
 *
 * マッチしないルート（静的ページや動的だが専用スケルトンを持たないページ）は
 * 汎用の `PageSkeleton` にフォールバックする。
 */
export function resolveLoadingFallback(pathname: string): ReactElement {
  const practiceResult = PRACTICE_RESULT_PATTERN.exec(pathname);
  if (practiceResult) {
    const slug = practiceResult[1];
    if (isPracticeMenuSlug(slug)) {
      return <PracticeResultLoadingFallback slug={slug} />;
    }
  }
  if (LEADERBOARD_DETAIL_PATTERN.test(pathname)) {
    return <LeaderboardDetailSkeleton />;
  }
  if (PUBLIC_PROFILE_PATTERN.test(pathname)) {
    return <PublicProfileSkeleton />;
  }
  return <PageSkeleton />;
}
