import { useCallback } from "react";
import { useNavigation, useRouter } from "expo-router";
import { StackActions } from "expo-router/react-navigation";

import {
  planCloseSession,
  type CloseSessionRoute,
} from "../lib/close-session-plan";
import { findRootStack } from "../lib/root-stack";

/** ここで使う navigation の形（expo-router の `useNavigation` の戻り値の一部） */
interface NavigationLike {
  getState():
    | {
        readonly key: string;
        readonly index: number;
        readonly routeNames: readonly string[];
        readonly routes: readonly CloseSessionRoute[];
      }
    | undefined;
  getParent(): NavigationLike | undefined;
  dispatch(
    action:
      | (ReturnType<typeof StackActions.pop> & { target?: string })
      | {
          readonly type: "REPLACE_PARAMS";
          readonly payload: { readonly params: object };
          readonly source: string;
          readonly target: string;
        },
  ): void;
}

/**
 * 解答中の画面・結果を閉じる
 * セッションを閉じる
 *
 * 解答中の画面と結果は、ルートのスタックの `(session)` グループとして下から
 * 全画面のモーダルで出す。ここで閉じるのは「そのモーダルを閉じる」ことで、
 * 下の画面が何であれ（練習の説明・レッスン・タブ）そこへ戻る。
 *
 * - 下が同じ練習の説明画面（`exitHref` と同じパス）なら、params を `exitHref` の
 *   クエリで置き換えてから閉じる。モーダルの中で出題範囲を変えた（トレーニング →
 *   チャレンジ等）とき、説明画面の `?variant=` を今回の値に合わせるため
 * - 下に何も無い（ディープリンク・再起動で直接開いた）ときだけ `exitHref`
 *   （説明画面）へ置き換える
 *
 * 以前は解答中の画面を通常の画面として積み、× は説明画面まで戻り、端からの
 * スワイプは下の画面へ戻っていた。行き先が食い違うのでスワイプを切っていたが、
 * モーダルでは × もスワイプ（全画面のモーダルには無い）も同じ「閉じる」で、
 * 行き先は構造上 1 つに決まる。チャレンジの中止の確認と終了のトーストは
 * 呼び出し側が持つ（ここは閉じるだけ）。判定は {@link planCloseSession}。
 *
 * @param exitHref - 閉じた後に見せたい説明画面（`/practice/<slug>?variant=…`・
 *   `/exam/<級>`）
 * @returns 閉じる関数（押したときに呼ぶ）
 */
export function useCloseSession(exitHref: string): () => void {
  const router = useRouter();
  const navigation = useNavigation<NavigationLike>();
  return useCallback(() => {
    const root = findRootStack(navigation);
    const state = root?.getState();
    const plan =
      state === undefined
        ? ({ kind: "replace" } as const)
        : planCloseSession(state.routes, state.index, exitHref);
    if (root === undefined || state === undefined || plan.kind === "replace") {
      router.replace(exitHref);
      return;
    }
    if (plan.replaceParams !== undefined) {
      root.dispatch({
        type: "REPLACE_PARAMS",
        payload: { params: plan.replaceParams.params },
        source: plan.replaceParams.key,
        target: state.key,
      });
    }
    root.dispatch({ ...StackActions.pop(plan.count), target: state.key });
  }, [router, navigation, exitHref]);
}
