import { useCallback } from "react";
import { useNavigation, useRouter } from "expo-router";

import {
  AUTH_SCREENS,
  planAuthScreenSwitch,
  type AuthScreen,
} from "./auth-screen-switch";

/**
 * 認証の流れの補助の画面から、ログイン・登録へ移る
 * 認証画面の切り替えフック
 *
 * 移り方の決まりは {@link planAuthScreenSwitch}。`params` は行き先を新しく
 * 開くときにだけ渡る（戻るときは、下の画面に入力した値が残っている）。
 */
export function useSwitchAuthScreen(): (
  target: AuthScreen,
  params?: Readonly<Record<string, string>>,
) => void {
  const router = useRouter();
  const navigation = useNavigation();
  return useCallback(
    (target, params) => {
      const state = navigation.getState();
      const below =
        state === undefined ? undefined : state.routes[state.index - 1]?.name;
      const href = { pathname: AUTH_SCREENS[target].pathname, params };
      switch (planAuthScreenSwitch(below, target)) {
        case "back":
          router.back();
          return;
        case "replaceBelow":
          // 遷移は順に処理されるので、置き換えは閉じた後の画面（下の流れの画面）に掛かる
          router.dismiss();
          router.replace(href);
          return;
        case "replace":
          router.replace(href);
          return;
      }
    },
    [router, navigation],
  );
}
