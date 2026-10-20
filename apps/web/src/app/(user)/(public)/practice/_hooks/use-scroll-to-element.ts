import { useLayoutEffect } from "react";

/**
 * 指定 id の要素をマウント時に一度だけビューポート先頭へスクロールする。
 *
 * blindfold-chess の useScrollToElement 準拠。練習開始直後にグローバルヘッダ分の
 * オフセットを解消し、タイトル・盤面・問題を画面上部に表示するために使う。
 *
 * 描画より前に送る。`useEffect`（描画の後）で送ると、スケルトンや盤面が
 * 一度ヘッダのぶん下の位置で描かれてから跳ね上がる。layout effect は
 * コミット直後・描画前に動くので、最初のフレームから送った位置で描かれる。
 *
 * 次のフレームの頭でもう一度送るのは、Next の遷移時のスクロール
 * （layout-router の `handlePotentialScroll`）がセグメントを包む親の
 * `componentDidMount` で動き、子の layout effect より後になるため。URL に
 * ハッシュの無いクライアント遷移（`router.push`）では、そこでページ先頭へ
 * 戻される。requestAnimationFrame はそのコミットの後・次の描画の前に動くので、
 * 戻された位置は画面に出ない。ハッシュ（`#practice-session`）付きの遷移では
 * Next も同じ要素へ送るので、2 度目は動かない。
 *
 * 直接読み込み（SSR）の最初の描画は JS より前なので、ここでは間に合わない。
 * ハッシュ付きの URL ならブラウザ自身が送り、無ければハイドレーションの
 * 時点で送る。
 *
 * @param elementId スクロール先要素の id
 */
export function useScrollToElement(elementId: string) {
  useLayoutEffect(() => {
    const scroll = () =>
      document
        .getElementById(elementId)
        ?.scrollIntoView({ behavior: "instant", block: "start" });

    scroll();
    const frame = requestAnimationFrame(scroll);
    return () => cancelAnimationFrame(frame);
  }, [elementId]);
}
