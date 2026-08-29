import { useEffect, useRef } from "react";

/**
 * 指定 id の要素をマウント時に一度だけビューポート先頭へスクロールする。
 *
 * blindfold-chess の useScrollToElement 準拠。練習開始直後にグローバルヘッダ分の
 * オフセットを解消し、タイトル・盤面・問題を画面上部に表示するために使う。
 *
 * 「一度だけ」の旗はスクロールを予約した時点ではなく、実際にスクロールした
 * 時点で立てる。StrictMode（開発時）は effect をマウント直後に一度捨てて
 * 呼び直すため、予約時に立てると捨てられた 1 回目で旗だけが残り、2 回目が
 * 自分で弾いて一度もスクロールしなくなる（本番ビルドでだけ効く挙動になる）。
 *
 * @param elementId スクロール先要素の id
 * @param enabled false の間はスクロールしない（対象要素が未マウントの場合などに使用）
 */
export function useScrollToElement(elementId: string, enabled: boolean = true) {
  const hasScrolled = useRef(false);

  useEffect(() => {
    if (!enabled || hasScrolled.current) return;

    const timer = setTimeout(() => {
      hasScrolled.current = true;
      document
        .getElementById(elementId)
        ?.scrollIntoView({ behavior: "instant", block: "start" });
    }, 100);

    return () => clearTimeout(timer);
  }, [elementId, enabled]);
}
