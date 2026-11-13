/**
 * ルートのスタックを探すのに要る navigation の形
 * （expo-router の `useNavigation` の戻り値の一部）
 */
interface ParentedNavigation<TSelf> {
  getState(): { readonly routeNames: readonly string[] } | undefined;
  getParent(): TSelf | undefined;
}

/**
 * ルートのスタック（`app/_layout.tsx` の Stack）の navigation
 * ルートスタック探索
 *
 * 今の画面から `getParent()` を辿り、`(tabs)` を画面に持つ navigator を探す。
 * いちばん上まで辿らないのは、expo-router がルートのレイアウトのさらに外に
 * 自分用の navigator（`__root`）を置いているため。
 *
 * モーダルを閉じる・モーダル越しに開く操作（`useCloseSession`・`useOpenFromModal`・
 * `useCloseModal`）は、どれもこの navigator に `pop` を送る。呼ぶ側が使う
 * `getState()` の中身と `dispatch` の型はフックごとに違うので、型は呼ぶ側の
 * ものをそのまま返す。
 *
 * @param navigation - 今の画面の navigation
 * @returns ルートのスタックの navigation。見つからなければ undefined
 */
export function findRootStack<T extends ParentedNavigation<T>>(
  navigation: T | undefined,
): T | undefined {
  let current = navigation;
  while (current !== undefined) {
    if (current.getState()?.routeNames.includes("(tabs)") === true) {
      return current;
    }
    current = current.getParent();
  }
  return undefined;
}
