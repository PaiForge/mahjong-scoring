import { isSessionRoute } from "./session-routes";

/**
 * 新版を検知したタブが「いつ・どう」新版へ乗り換えるかの判定
 * 版の乗り換え判定
 *
 * デプロイ後も開いたままのタブは、古いバンドルと先読み済みの古いページを
 * 持ち続ける。Next はサーバーへ問い合わせる遷移でビルドの不一致を検知すると
 * フルリロードに切り替えるが、先読みの手元で済む遷移と、遷移せずに留まる
 * タブには何もしない。その穴をここで埋める。
 *
 * 利用者に「更新があったので再読み込みしてください」とは言わない。乗り換えは
 * 利用者の作業を壊さない瞬間に、黙って行う。
 *
 * - **今すぐ再読み込みしてよいか** — 出題セッションの最中（時計とライフが
 *   動いている）と、文字を入力している最中（フォームの内容が飛ぶ）は避ける
 * - **避けた場合** — 次の画面内リンクのクリックをフルナビゲーションに
 *   差し替える。利用者から見れば普通の遷移で、着いた先が新版になる
 *
 * ここは判定だけで、DOM に触る副作用は `AppVersionWatcher` が持つ。
 */

/**
 * 利用者が文字を入力している要素か
 *
 * ボタン・チェックボックス等の押す類の input は含めない（再読み込みで
 * 失われる状態を持たない）。`contenteditable` も入力中として扱う。
 */
export function isEditingElement(element: Element | null | undefined): boolean {
  if (!element) return false;
  if (element instanceof HTMLTextAreaElement) return true;
  if (element instanceof HTMLSelectElement) return true;
  if (element instanceof HTMLInputElement) {
    return !NON_TEXT_INPUT_TYPES.has(element.type);
  }
  return element instanceof HTMLElement && element.isContentEditable === true;
}

const NON_TEXT_INPUT_TYPES: ReadonlySet<string> = new Set([
  "button",
  "checkbox",
  "color",
  "file",
  "hidden",
  "image",
  "radio",
  "range",
  "reset",
  "submit",
]);

/**
 * 今この瞬間にページを再読み込みしてよいか
 *
 * @param pathname 表示中のパス名
 * @param activeElement フォーカスを持つ要素（`document.activeElement`）
 */
export function canReloadNow(
  pathname: string,
  activeElement: Element | null | undefined,
): boolean {
  return !isSessionRoute(pathname) && !isEditingElement(activeElement);
}

/**
 * クリックがフルナビゲーションに差し替えてよい画面内リンクなら、その遷移先の URL
 *
 * 差し替えないもの（undefined）:
 * - 左クリック以外、修飾キー付き（新しいタブで開く等、ブラウザの既定に任せる）
 * - 既定の動作が取り消されているもの（他のハンドラが処理した）
 * - `<a href>` の外、別オリジン、`download`、`target` 付き、ハッシュだけの移動
 *
 * @param event クリックイベント（capture フェーズで受ける）
 * @param location 現在の `window.location`
 */
export function resolveFullNavigationHref(
  event: MouseEvent,
  location: Pick<Location, "origin" | "pathname" | "search">,
): string | undefined {
  if (event.defaultPrevented || event.button !== 0) return undefined;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
    return undefined;
  }
  if (!(event.target instanceof Element)) return undefined;
  const anchor = event.target.closest("a[href]");
  if (!(anchor instanceof HTMLAnchorElement)) return undefined;
  if (anchor.hasAttribute("download") || anchor.target !== "") {
    return undefined;
  }

  const url = new URL(anchor.href, location.origin);
  if (url.origin !== location.origin) return undefined;
  if (
    url.pathname === location.pathname &&
    url.search === location.search &&
    url.hash !== ""
  ) {
    return undefined;
  }
  return url.href;
}
