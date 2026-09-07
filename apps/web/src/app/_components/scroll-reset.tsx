"use client";

import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef } from "react";

/**
 * ページ遷移でスクロール位置を先頭へ戻す。
 * スクロールリセット
 *
 * Next.js のスクロールリセットは、遷移先セグメントの**本体**がコミットされた
 * ときに走る。`loading.tsx` の Suspense フォールバックが出ている間は、
 * スクロール先の判定に使う Fragment に可視の要素が無く（フォールバックは
 * React の兄弟として描かれ、本体側は隠される）、「対象なし」としてスクロールを
 * 消費せず保留する。結果、深くスクロールした状態で遷移すると
 *
 *   1. スケルトンが前ページのスクロール位置のまま表示され
 *      （ページが短くなったぶんブラウザに押し戻されて中腹に落ちることもある）
 *   2. サーバー応答が届いた瞬間に先頭まで飛ぶ
 *
 * という二段階の動きになる。全ページに `loading.tsx` を置いているため
 * すべての遷移で起きる。ここでスケルトンと同じコミットで先頭へ戻し、
 * 「押したら先頭から読み始める」素の遷移と同じ着地に揃える。
 *
 * 先頭へ戻さないのは次の 3 つ。
 *
 * - **初回マウント** — リロード時のブラウザによるスクロール位置の復元と、
 *   ハッシュ付き URL の直接読み込みを潰さないため
 * - **戻る / 進む** — 読者は離れた位置を再訪しており、復元が正しい着地。
 *   `popstate` の時点で URL は更新済みなので、そこで控えたパスと遷移後の
 *   パスが一致するかで履歴移動かどうかを見分ける
 * - **ハッシュ付き遷移** — 練習セッションの `#practice-session` のように
 *   行き先が指定されている
 *
 * ペイント前に位置を確定させるため `useLayoutEffect` を使う。`useEffect` では
 * スケルトンが前の位置に一度描かれてから跳ぶので、直そうとしている動きが
 * そのまま小さく残る。React 19 のサーバー描画では no-op になるため、
 * クライアント専用であることによる警告は出ない。
 */
export function ScrollReset() {
  const pathname = usePathname();
  const hasMounted = useRef(false);
  /** 直前の `popstate` 時点のパス。履歴移動を見分けるためだけに持つ。 */
  const poppedPathname = useRef<string | undefined>(undefined);

  useEffect(() => {
    const rememberPop = () => {
      poppedPathname.current = window.location.pathname;
    };
    window.addEventListener("popstate", rememberPop);
    return () => window.removeEventListener("popstate", rememberPop);
  }, []);

  useLayoutEffect(() => {
    const popped = poppedPathname.current;
    poppedPathname.current = undefined;

    if (!hasMounted.current) {
      hasMounted.current = true;
      return;
    }
    if (popped === pathname) return;
    if (window.location.hash !== "") return;

    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  return null;
}
