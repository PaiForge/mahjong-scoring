"use client";

/**
 * 遷移してから出すトースト
 *
 * 「練習を終了しました」のように、押した直後にページを離れる操作の報せに使う。
 * その場で `toast()` を呼ぶと表示時間が遷移の裏で減り始め、遷移先が描き終えた
 * ときには残りわずかになっている。視線も切り替わる本文側にあるため、画面下端の
 * トーストは出たことに気づかれないまま消える。
 *
 * 呼び出し側は遷移先の href と一緒に文言をここへ預け、
 * {@link import("../global-toaster").GlobalToaster} が着地（pathname の変化）を
 * 見てから出す。GlobalToaster はルートレイアウトにいるため遷移をまたいで生き残り、
 * 表示時間は遷移先に着いた時点から始まる。
 *
 * 預かりは 1 件だけ持ち、次に pathname が変わった時点で必ず捨てる。遷移が
 * 起きなかった場合や別の場所へ飛んだ場合に、無関係なページで後から出るのを防ぐ。
 *
 * 遷移を伴わない報せ（その場に留まる保存完了など）はここを通さず `toast()` を
 * 直接呼ぶこと。着地を待てないまま宙に浮く。
 */

interface PendingToast {
  /** 着地したと判定する pathname */
  readonly pathname: string;
  readonly message: string;
}

/**
 * モジュールスコープに置くのは、預けた側（離脱するページ）が遷移で unmount
 * されるため。React の state では受け手へ渡す前に消える。
 */
let pending: PendingToast | null = null;

/** 着地判定はパスだけで行う。クエリ・ハッシュは同じページの中の状態なので見ない */
function pathnameOf(href: string): string {
  return href.split(/[?#]/)[0] ?? href;
}

/** 遷移先 `href` に着いたら `message` を出すよう預ける */
export function toastOnArrival(href: string, message: string): void {
  pending = { pathname: pathnameOf(href), message };
}

/**
 * 預かりを取り出す（着地先が違えば捨てるだけ）。
 * pathname が変わるたびに呼ぶ前提で、呼べば必ず空になる。
 */
export function takeToastOnArrival(pathname: string): string | null {
  const queued = pending;
  pending = null;
  return queued?.pathname === pathname ? queued.message : null;
}
