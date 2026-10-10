import { useCallback, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";

import { refreshAccount } from "../auth/use-auth";
import type { MypageApiFailure, MypageApiResult } from "./mypage-api";

/**
 * マイページ・マイレコードの読み込み状態
 *
 * - `loading` — まだ 1 度も読めていない
 * - `loaded` — 読めた。読み直している間も前の値を出し続け、`pending` で知らせる
 * - `failed` — 読めなかった。前に読めた値があっても失敗を出す（古い値を
 *   最新のように見せない）
 */
export type MypageReadState<T> =
  | { readonly kind: "loading" }
  | { readonly kind: "loaded"; readonly value: T; readonly pending: boolean }
  | { readonly kind: "failed"; readonly error: MypageApiFailure };

/**
 * マイページ・マイレコードの材料を読み、画面を開くたびに読み直す
 * マイページ読み込み
 *
 * 練習から戻ってきたときに新しい記録が出るよう、表示のたびに読み直す。
 * `read` が変わったとき（土俵や期間を選び直したとき）も読み直す。呼び出し側は
 * `read` を `useCallback` で包み、条件が変わったときだけ作り直すこと。
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
  const [state, setState] = useState<MypageReadState<T>>({ kind: "loading" });
  // 古い要求の結果が新しい要求の結果を上書きしないよう、最後の要求だけを採る
  const latest = useRef(0);

  const reload = useCallback(() => {
    const request = ++latest.current;
    setState((prev) =>
      prev.kind === "loaded" ? { ...prev, pending: true } : prev,
    );
    void read().then((result) => {
      if (request !== latest.current) return;
      if ("error" in result) {
        if (result.error === "usernameRequired") void refreshAccount();
        setState({ kind: "failed", error: result.error });
        return;
      }
      setState({ kind: "loaded", value: result, pending: false });
    });
  }, [read]);

  // 開いたとき・戻ってきたときに読む。フォーカス中に `reload` が作り直されたとき
  // （`read` が変わったとき）も、useFocusEffect がもう一度呼ぶ
  useFocusEffect(reload);

  return { state, reload };
}
