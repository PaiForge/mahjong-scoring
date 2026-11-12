import { findRouteIndexByHref, paramsForHref } from "./route-pathname";

/** ルートのスタックで、解答中の画面と結果をまとめるグループのルート名 */
export const SESSION_ROUTE_NAME = "(session)";

/** 判定に使うルートのスタックの画面（`navigation.getState().routes` の一部） */
export interface CloseSessionRoute {
  readonly key: string;
  readonly name: string;
  readonly params?: object;
}

/**
 * 解答中の画面・結果を閉じるときの動き
 *
 * - `close` — ルートのスタックを `count` 画面ぶん閉じる（`(session)` とその上）。
 *   `replaceParams` があれば、閉じる前に下の画面の params をその値で置き換える
 * - `replace` — 下に画面が無い。`exitHref` へ置き換える
 */
export type CloseSessionPlan =
  | {
      readonly kind: "close";
      readonly count: number;
      readonly replaceParams?: {
        readonly key: string;
        readonly params: Record<string, string>;
      };
    }
  | { readonly kind: "replace" };

/**
 * 解答中の画面・結果を閉じる動きを決める
 * セッションを閉じる判定
 *
 * いちばん上の `(session)` を探し、その 1 つ下の画面で分ける:
 *
 * | 1 つ下の画面 | 動き |
 * | --- | --- |
 * | `exitHref` と同じパス（同じ練習の説明画面） | params を `exitHref` のクエリで置き換えてから閉じる |
 * | 別の画面（タブ・レッスン・別の練習の説明等） | そのまま閉じる（下の画面へ戻る） |
 * | 無い（ディープリンク・再起動で直接開いた） | `exitHref` へ置き換える |
 *
 * 同じパスの説明画面へ戻るときに params を置き換えるのは、トレーニング →
 * チャレンジのようにモーダルの中で出題範囲（`?variant=`）を変えたとき、閉じる
 * だけだと説明画面が前の範囲のまま残るため。パスは slug まで含めて照合する
 * （`practice/[slug]` は 1 つのルートを slug ごとに使い回すので、ルート名だけでは
 * 別の練習の説明画面と区別できない）。
 *
 * `(session)` の上に別のモーダル（`(account)` 等）が重なっていれば、それも
 * まとめて閉じる。`(session)` が見つからないとき（グループの外で呼んだ）は
 * `replace` を返す。
 *
 * @param routes - ルートのスタックの画面（下から順）
 * @param index - 今見えている画面の位置（`state.index`）
 * @param exitHref - 閉じた後に見せたい説明画面（`/practice/<slug>?variant=…`）
 */
export function planCloseSession(
  routes: readonly CloseSessionRoute[],
  index: number,
  exitHref: string,
): CloseSessionPlan {
  let sessionIndex = -1;
  for (let i = Math.min(index, routes.length - 1); i >= 0; i--) {
    if (routes[i]?.name === SESSION_ROUTE_NAME) {
      sessionIndex = i;
      break;
    }
  }
  const below = sessionIndex > 0 ? routes[sessionIndex - 1] : undefined;
  if (below === undefined) return { kind: "replace" };
  const count = index - sessionIndex + 1;
  const isExitBelow =
    findRouteIndexByHref(routes, sessionIndex, exitHref) === sessionIndex - 1;
  if (!isExitBelow) return { kind: "close", count };
  return {
    kind: "close",
    count,
    replaceParams: {
      key: below.key,
      params: paramsForHref(below.name, below.params, exitHref),
    },
  };
}
