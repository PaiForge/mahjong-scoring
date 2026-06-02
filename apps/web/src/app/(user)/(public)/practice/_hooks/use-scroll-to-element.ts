import { useEffect, useRef } from "react";

/**
 * 指定 id の要素をマウント時に一度だけビューポート先頭へスクロールする。
 *
 * blindfold-chess の useScrollToElement 準拠。練習開始直後にグローバルヘッダ分の
 * オフセットを解消し、タイトル・盤面・問題を画面上部に表示するために使う。
 *
 * @param elementId スクロール先要素の id
 * @param enabled false の間はスクロールしない（対象要素が未マウントの場合などに使用）
 */
export function useScrollToElement(elementId: string, enabled: boolean = true) {
  const hasScrolled = useRef(false);

  useEffect(() => {
    if (!enabled || hasScrolled.current) return;
    hasScrolled.current = true;

    const timer = setTimeout(() => {
      document
        .getElementById(elementId)
        ?.scrollIntoView({ behavior: "instant", block: "start" });
    }, 100);

    return () => clearTimeout(timer);
  }, [elementId, enabled]);
}
