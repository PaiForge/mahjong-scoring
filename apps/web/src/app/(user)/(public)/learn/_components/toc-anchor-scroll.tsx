"use client";

import { useEffect } from "react";

/**
 * 目次の章へのアンカー着地をページ本体のマウント後にやり直す
 * 目次アンカー着地
 *
 * 目次（`/learn`）には loading.tsx（Suspense 境界）があるため、
 * `/learn#chapter-<slug>` への遷移の瞬間に描画されているのはスケルトンで、
 * 対象の id はまだ DOM に無い。Next.js はその時点で一度だけ対象を探して
 * スクロールを諦め、本体が届いた後に再試行しない（設定ページの
 * `AnchorScroll` と同じ事情）。このコンポーネントは本体と一緒にマウント
 * されるので、effect が走る時点では対象が必ず DOM にある。
 *
 * 位置合わせは対象の `scroll-mt-*` に任せる。
 */
export function TocAnchorScroll() {
  useEffect(() => {
    const hash = window.location.hash;
    if (hash === "") return;
    document
      .getElementById(decodeURIComponent(hash.slice(1)))
      ?.scrollIntoView();
  }, []);

  return null;
}
