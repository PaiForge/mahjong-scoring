"use client";

import { useEffect, useRef } from "react";

import { useAuth } from "@/app/_contexts/auth-context";

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
 * ただし未ログインのときはスクロールしない。設定項目は会員限定で、未ログインでは
 * ぼかしと会員登録 CTA に覆われて操作できないため、目当ての項目まで送り届けても
 * 読者にできることが無い。しかも CTA は覆っている領域全体の中央にあり、項目まで
 * スクロールすると画面外へ置き去りになる。ハッシュを無視して素の遷移
 * （ページ先頭への着地）に落とし、まず CTA を見せる。
 *
 * 認証状態が確定するまでは何もしない。確定前は未ログインと区別が付かず、先に
 * スクロールしてしまうと未ログインの読者を項目まで運んでしまうため。
 *
 * `:target` のハイライトは URL のハッシュだけで効くので、ここではスクロールのみ行う。
 */
export function AnchorScroll() {
  const { user, isLoading } = useAuth();
  // 認証状態は後から変わりうる（サインアウト等）が、着地のやり直しは 1 回きり。
  const hasLanded = useRef(false);

  useEffect(() => {
    if (isLoading || hasLanded.current) return;
    hasLanded.current = true;
    if (!user) return;

    const hash = window.location.hash;
    if (hash === "") return;
    document
      .getElementById(decodeURIComponent(hash.slice(1)))
      ?.scrollIntoView();
  }, [isLoading, user]);

  return null;
}
