import { useEffect } from "react";

import { refreshAccount } from "../auth/use-auth";
import { useFocusRead, type FocusReadState } from "../lib/use-focus-read";
import type { MypageApiFailure, MypageApiResult } from "./mypage-api";

/**
 * マイページ・マイレコードの読み込み状態（{@link FocusReadState}）
 *
 * `failed` は、前に読めた値があっても失敗を出す（古い値を最新のように見せない）。
 */
export type MypageReadState<T> = FocusReadState<T, MypageApiFailure>;

/**
 * マイページ・マイレコードの材料を読み、画面を開くたびに読み直す
 * マイページ読み込み
 *
 * {@link useFocusRead} そのもの（練習から戻ってきたときに新しい記録が出るよう、
 * 表示のたびに読み直す。`read` が変わったとき（土俵や期間を選び直したとき）も
 * 読み直す。呼び出し側は `read` を `useCallback` で包み、条件が変わったときだけ
 * 作り直すこと）に、マイページの失敗の扱いを 1 つ足したもの。
 *
 * サーバーが「ユーザー名を決めていない」と答えたら、アカウント状態を
 * 読み直す — 画面はそれを見てユーザー名の案内に切り替わる。
 */
export function useMypageRead<T extends object>(
  read: () => Promise<MypageApiResult<T>>,
): {
  readonly state: MypageReadState<T>;
  readonly reload: () => void;
} {
  const { state, reload } = useFocusRead(read);

  useEffect(() => {
    if (state.kind === "failed" && state.error === "usernameRequired")
      void refreshAccount();
  }, [state]);

  return { state, reload };
}
