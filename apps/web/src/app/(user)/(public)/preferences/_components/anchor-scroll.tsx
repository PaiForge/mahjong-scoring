"use client";

import { useEffect } from "react";

/**
 * ハッシュアンカーへの着地をページ本体のマウント後にやり直す。
 *
 * このページには loading.tsx（Suspense 境界）があるため、`/preferences#term-links`
 * のようなハッシュ付き遷移の瞬間に描画されているのはスケルトンで、対象の id は
 * まだ DOM に無い。Next.js はその時点で一度だけ対象を探してスクロールを諦め、
 * 本体がストリーミングで届いた後に再試行しないので、前ページのスクロール位置が
 * 残ったままになる。このコンポーネントはページ本体と一緒にマウントされるため、
 * effect が走る時点では対象の id が必ず存在する。
 *
 * `:target` のハイライトは URL のハッシュだけで効くので、ここではスクロールのみ行う。
 */
export function AnchorScroll() {
  useEffect(() => {
    const hash = window.location.hash;
    if (hash === "") return;
    document
      .getElementById(decodeURIComponent(hash.slice(1)))
      ?.scrollIntoView();
  }, []);

  return null;
}
