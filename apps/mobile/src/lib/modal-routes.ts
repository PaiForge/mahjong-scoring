/**
 * ルートのスタックでモーダルとして出すルート名
 * モーダルのルート
 *
 * グループ 2 つ（解答中の画面と結果の `(session)`・マイページと設定と認証の
 * `(account)`）と、詳細のシート 3 つ（用語・お知らせ・級の詳細）。
 * `app/_layout.tsx` の `Stack.Screen` の `presentation` と同じ集合を持つ。
 *
 * iOS では、モーダルの後に積んだ通常の画面（card）はモーダルの下に入って
 * 見えない（ネイティブのスタックはモーダルの列を push の列の上に提示する）。
 * モーダルの中から通常の画面を開くときは、先にモーダルを閉じる
 * （`useOpenFromModal`）。その数を数えるのに使う。
 */
export const MODAL_ROUTE_NAMES: ReadonlySet<string> = new Set([
  "(session)",
  "(account)",
  "reference/glossary/[slug]",
  "announcements/[slug]",
  "dojo/ranks/[slug]",
]);

/** `(account)` のグループに入る画面のパスの先頭 */
const ACCOUNT_SECTIONS: ReadonlySet<string> = new Set([
  "mypage",
  "preferences",
  "sign-in",
  "sign-up",
  "forgot-password",
  "leaderboard",
]);

/**
 * 行き先が `(account)` の画面か（クエリ・ハッシュは見ない）
 * アカウントの画面の判定
 *
 * `/mypage` `/preferences` `/sign-in` `/sign-up` `/forgot-password`
 * `/leaderboard` と、その下のパス。`(account)` はモーダルの中にスタックを持つので、
 * その中の画面へはモーダルを閉じずに積む。
 *
 * @param href - 行き先（`/mypage/account?x=1` のようなクエリ付きでよい）
 */
export function isAccountHref(href: string): boolean {
  const pathname = href.split(/[?#]/, 1)[0] ?? href;
  const [section] = pathname.split("/").filter(Boolean);
  return section !== undefined && ACCOUNT_SECTIONS.has(section);
}

/**
 * ルートのスタックの末尾に連なるモーダルの数
 * 末尾のモーダルの数
 *
 * `index`（今見えている画面）から下へ、{@link MODAL_ROUTE_NAMES} に入る
 * 画面が続く数を返す。いちばん上がモーダルでなければ 0。
 *
 * @param routes - ルートのスタックの画面の列（`navigation.getState().routes`）
 * @param index - 今見えている画面の位置（`state.index`）
 */
export function trailingModalCount(
  routes: readonly { readonly name: string }[],
  index: number,
): number {
  let count = 0;
  for (let i = Math.min(index, routes.length - 1); i >= 0; i--) {
    const route = routes[i];
    if (route === undefined || !MODAL_ROUTE_NAMES.has(route.name)) break;
    count++;
  }
  return count;
}
