import { createContext, use, useId, useLayoutEffect, useRef } from "react";

/** `Screen` が子孫へ配る、読み直しの登録口 */
export interface ScreenRefreshRegistry {
  readonly set: (id: string, refresh: () => Promise<void>) => void;
  readonly remove: (id: string) => void;
}

/** 最寄りの `Screen` の登録口（`Screen` の外では無い） */
export const ScreenRefreshContext = createContext<
  ScreenRefreshRegistry | undefined
>(undefined);

/**
 * 最寄りの `Screen` を「引っ張って更新」できるようにする
 * 引っ張って更新
 *
 * サーバーの値を出す画面（マイページ・マイレコード・ランキングでの順位・お知らせ・
 * 通知・プラン）で、材料を読む部品が自分の読み直しを登録する。本文を下へ引くと
 * `Screen` が登録された読み直しをすべて呼び、終わるまで OS の更新の印を出す。
 * 1 つも登録されていない画面は引いても何も出ない。
 *
 * 画面は表示のたびに読み直している（`useFocusRead`）ので、これは同じ画面に
 * 居たまま新しくするための操作。スマホアプリでは一覧を新しくしたいときに
 * まず試す操作で、無いと「更新できない画面」に見える。
 *
 * 登録口を Context で配るのは、`Screen` を描く部品と材料を読む部品が別だから
 * （読む部品は `Screen` の子。ヘッダーのボタンの `HeaderIconButton` と同じ形）。
 *
 * @param reload 読み直し。読み終えたら（成功でも失敗でも）解決する Promise を返す
 */
export function usePullToRefresh(reload: () => Promise<void>): void {
  const registry = use(ScreenRefreshContext);
  const id = useId();
  const reloadRef = useRef(reload);
  useLayoutEffect(() => {
    reloadRef.current = reload;
  });
  useLayoutEffect(() => {
    if (registry === undefined) return;
    registry.set(id, () => reloadRef.current());
    return () => registry.remove(id);
  }, [registry, id]);
}
