import { useLayoutEffect } from "react";

/**
 * 指定 id の要素を、マウントの時点と次のフレームの頭の 2 回、ビューポート先頭へ
 * スクロールする。
 * 練習先頭へのスクロール
 *
 * 練習開始直後にグローバルヘッダとタイトル帯を画面外へ送り、盤面・問題を画面上部に
 * 表示するために使う。クライアント遷移で最初に描くフレームの位置を決めるのはこの
 * hook で、遷移リンクのハッシュ（`#practice-session`）は Next のハッシュ遷移の
 * スクロールが同じコミットで同じ要素へ向くようにする補助に留まる。
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
 * ルートレイアウトの `ScrollReset` もハッシュの無い遷移で先頭へ戻すが、こちらは
 * `{children}` より前に置かれていて子の layout effect より先に動くため、1 回目の
 * スクロールが上書きする。並びが変わって後になっても、2 回目が吸収する。
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
