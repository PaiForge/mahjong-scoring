"use client";

import { stripLocalePrefix } from "@/i18n/public-path";
import { safeSessionStorage } from "@/lib/safe-storage";

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
 * 預かりは sessionStorage にも写す。ページを読み込み直す遷移（ログインの
 * `window.location.href`）や、外のサイトを経由して戻る遷移（Google の OAuth）では
 * モジュールの変数が消えるため。読み込み直した先では GlobalToaster が最初の
 * pathname で取り出す。sessionStorage はタブごとなので、別のタブでは出ない。
 *
 * 遷移を伴わない報せ（その場に留まる保存完了など）はここを通さず `toast()` を
 * 直接呼ぶこと。着地を待てないまま宙に浮く。
 *
 * **着地の判定はロケール接頭辞を外したパスで比べる。** 呼び出し側が預ける href は
 * ロケール非依存（`/practice/jantou-fu`）で、遷移は `@/i18n/navigation` の
 * `useRouter` が今の言語の接頭辞を付ける。GlobalToaster が渡す `usePathname()`
 * （next/navigation）はアドレスバーの形（英語なら `/en/practice/jantou-fu`）。
 * 預ける側と取り出す側の両方で `stripLocalePrefix` を通し、同じ形で比べる。
 * 片方だけ外すと英語のページで着地の判定が常に外れる。管理画面のパスは接頭辞を
 * 持たないので恒等。
 */

/**
 * 出し方。{@link import("../toast-card").ToastCard} の 2 段の強さに対応する。
 * notice は淡い塗りの報告（既定）、success は濃い塗りの完了。
 */
export type ArrivalToastTone = "notice" | "success";

export interface ArrivalToast {
  readonly message: string;
  readonly tone: ArrivalToastTone;
}

interface PendingToast extends ArrivalToast {
  /** 着地したと判定する pathname */
  readonly pathname: string;
}

/**
 * モジュールスコープに置くのは、預けた側（離脱するページ）が遷移で unmount
 * されるため。React の state では受け手へ渡す前に消える。
 */
let pending: PendingToast | null = null;

/** 読み込み直しをまたぐ写し（{@link pending} と同じ中身） */
const STORAGE_KEY = "toast-on-arrival";

function readStored(): PendingToast | null {
  const raw = safeSessionStorage.getItem(STORAGE_KEY);
  if (raw === null) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (
      typeof value === "object" &&
      value !== null &&
      "pathname" in value &&
      typeof value.pathname === "string" &&
      "message" in value &&
      typeof value.message === "string" &&
      "tone" in value &&
      (value.tone === "notice" || value.tone === "success")
    )
      return {
        pathname: value.pathname,
        message: value.message,
        tone: value.tone,
      };
  } catch {
    // 壊れた写しは無かったことにする
  }
  return null;
}

/**
 * 着地判定に使うパス。クエリ・ハッシュは同じページの中の状態なので見ない。
 * ロケール接頭辞も外す（英語の `/en/...` と預けたロケール非依存の href を揃える）
 */
function pathnameOf(href: string): string {
  return stripLocalePrefix(href.split(/[?#]/)[0] ?? href);
}

/** 遷移先 `href` に着いたら `message` を出すよう預ける */
export function toastOnArrival(
  href: string,
  message: string,
  tone: ArrivalToastTone = "notice",
): void {
  pending = { pathname: pathnameOf(href), message, tone };
  safeSessionStorage.setItem(STORAGE_KEY, JSON.stringify(pending));
}

/**
 * 預かりを取り出す（着地先が違えば捨てるだけ）。
 * pathname が変わるたびに呼ぶ前提で、呼べば必ず空になる。
 *
 * @param pathname - 今のアドレスバーのパス（`/en/...` のままでよい。接頭辞はここで外す）
 */
export function takeToastOnArrival(pathname: string): ArrivalToast | null {
  const queued = pending ?? readStored();
  pending = null;
  safeSessionStorage.removeItem(STORAGE_KEY);
  if (queued?.pathname !== pathnameOf(pathname)) return null;
  return { message: queued.message, tone: queued.tone };
}
