import { useCallback } from "react";
import { useNavigation, useRouter } from "expo-router";

import { findRouteIndexByHref, paramsForHref } from "../lib/route-pathname";

/**
 * 履歴にある行き先の画面まで閉じて戻る（無ければ今の画面を置き換える）
 * パス一致の dismissTo
 *
 * `router.dismissTo` は履歴の画面をルート名だけで照合する。`practice/[slug]`
 * のように 1 つのルートを slug ごとに使い回す画面では、間に別の slug の
 * 説明画面が挟まっていると、そちらまで戻って params を書き換えてしまう
 * （画面の中の状態は前の練習のまま残る）。ここでは slug まで含めたパスで
 * 照合し、一致した画面の params を href のクエリで置き換えて、その上だけを
 * 閉じる。
 *
 * 呼ぶのはルートのスタックに直接積んだ画面（解答中・結果）に限る。
 */
export function useDismissToHref(): (href: string) => void {
  const router = useRouter();
  const navigation = useNavigation();
  return useCallback(
    (href: string) => {
      const state = navigation.getState();
      const found =
        state === undefined
          ? undefined
          : findRouteIndexByHref(state.routes, state.index, href);
      const target = found === undefined ? undefined : state?.routes[found];
      if (state !== undefined && found !== undefined && target !== undefined) {
        // 戻り先の params を href の内容に置き換えてから、その上を閉じる
        // （閉じるだけだと href の `?variant=` が捨てられ、前の値が残る）
        navigation.dispatch({
          type: "REPLACE_PARAMS",
          payload: { params: paramsForHref(target.name, target.params, href) },
          source: target.key,
          target: state.key,
        });
        navigation.dispatch({
          type: "POP",
          payload: { count: state.index - found },
          target: state.key,
        });
      } else {
        router.replace(href);
      }
    },
    [router, navigation],
  );
}
