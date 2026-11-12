import { useCallback } from "react";
import { useNavigation, useRouter } from "expo-router";
import { StackActions } from "expo-router/react-navigation";

import { isAccountHref, trailingModalCount } from "../lib/modal-routes";

/** ここで使う navigation の形（expo-router の `useNavigation` の戻り値の一部） */
interface NavigationLike {
  getState():
    | {
        readonly key: string;
        readonly index: number;
        readonly routeNames: readonly string[];
        readonly routes: readonly { readonly name: string }[];
      }
    | undefined;
  getParent(): NavigationLike | undefined;
  dispatch(
    action: ReturnType<typeof StackActions.pop> & { target?: string },
  ): void;
}

/**
 * ルートのスタック（`app/_layout.tsx` の Stack）の navigation
 *
 * 今の画面から `getParent()` を辿り、`(tabs)` を画面に持つ navigator を探す。
 * いちばん上まで辿らないのは、expo-router がルートのレイアウトのさらに外に
 * 自分用の navigator（`__root`）を置いているため。
 */
function findRootStack(
  navigation: NavigationLike | undefined,
): NavigationLike | undefined {
  let current = navigation;
  while (current !== undefined) {
    if (current.getState()?.routeNames.includes("(tabs)") === true) {
      return current;
    }
    current = current.getParent();
  }
  return undefined;
}

/**
 * モーダルの中から行き先を開く
 * モーダル越しの遷移
 *
 * iOS では、モーダルの後に積んだ通常の画面はモーダルの下に入って見えない
 * （ネイティブのスタックはモーダルの列を push の列の上に提示する）。そこで
 * 行き先が `(account)` の画面（`isAccountHref`。モーダルの中のスタックに積む）
 * ならそのまま push し、それ以外は上に連なるモーダルをすべて閉じてから push する。
 * 閉じるのと積むのは続けて dispatch してよい（遷移は順に処理される）。
 *
 * モーダルの外で呼んでも同じ（閉じるものが無いので、ただの push）。モーダルの
 * 下に画面が無い（ディープリンクでモーダルを直接開いた）ときは、いちばん下の
 * モーダルを行き先で置き換える — 閉じきると空のスタックになるため。
 */
export function useOpenFromModal(): (href: string) => void {
  const router = useRouter();
  const navigation = useNavigation<NavigationLike>();
  return useCallback(
    (href: string) => {
      if (isAccountHref(href)) {
        router.push(href);
        return;
      }
      const root = findRootStack(navigation);
      const state = root?.getState();
      const count =
        state === undefined ? 0 : trailingModalCount(state.routes, state.index);
      if (root === undefined || state === undefined || count === 0) {
        router.push(href);
        return;
      }
      if (count > state.index) {
        // 下に画面が無い。いちばん下のモーダルだけ残して置き換える
        if (state.index > 0) {
          root.dispatch({
            ...StackActions.pop(state.index),
            target: state.key,
          });
        }
        router.replace(href);
        return;
      }
      root.dispatch({ ...StackActions.pop(count), target: state.key });
      router.push(href);
    },
    [router, navigation],
  );
}

/**
 * いちばん上のモーダルを 1 つ閉じる
 * モーダルを閉じる
 *
 * モーダルの下に画面が無い（ディープリンクでモーダルを直接開いた）ときや、
 * いちばん上がモーダルでないときは `fallbackHref` へ置き換える
 * （`backFallbackHref` の決まり。ルートに anchor を置かないため、直接開いた
 * 画面の下には何も無い）。
 */
export function useCloseModal(): (fallbackHref: string) => void {
  const router = useRouter();
  const navigation = useNavigation<NavigationLike>();
  return useCallback(
    (fallbackHref: string) => {
      const root = findRootStack(navigation);
      const state = root?.getState();
      const count =
        state === undefined ? 0 : trailingModalCount(state.routes, state.index);
      if (
        root !== undefined &&
        state !== undefined &&
        count > 0 &&
        state.index > 0
      ) {
        root.dispatch({ ...StackActions.pop(1), target: state.key });
        return;
      }
      router.replace(fallbackHref);
    },
    [router, navigation],
  );
}
