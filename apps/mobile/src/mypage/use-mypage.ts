import { useCallback, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import type { MobileMypageResponse } from "@mahjong-scoring/features/mypage/mobile-api";

import { refreshAccount } from "../auth/use-auth";
import { fetchMypage, type MypageApiFailure } from "./mypage-api";

/**
 * マイページの材料の読み込み状態
 *
 * - `loading` — まだ 1 度も読めていない
 * - `loaded` — 読めた（読み直している間も前の値を出し続ける）
 * - `failed` — 読めなかった。前に読めた値があっても失敗を出す（古い値を
 *   最新のように見せない）
 */
export type MypageState =
  | { readonly kind: "loading" }
  | { readonly kind: "loaded"; readonly mypage: MobileMypageResponse }
  | { readonly kind: "failed"; readonly error: MypageApiFailure };

/**
 * マイページの材料を読み、画面を開くたびに読み直す
 * マイページ読み込み
 *
 * 練習から戻ってきたときに今日の経験値が増えているよう、表示のたびに
 * 読み直す（タブではなく積む画面なので、開くたびに 1 回）。
 *
 * サーバーが「ユーザー名を決めていない」と答えたら、アカウント状態を
 * 読み直す — 画面はそれを見てユーザー名の案内に切り替わる。
 *
 * @param userId - ユーザー名を決めたログイン中のユーザー。undefined なら読まない
 */
export function useMypage(userId: string | undefined): {
  readonly state: MypageState;
  readonly reload: () => void;
} {
  const [state, setState] = useState<MypageState>({ kind: "loading" });
  // 古い要求の結果が新しい要求の結果を上書きしないよう、最後の要求だけを採る
  const latest = useRef(0);

  const reload = useCallback(() => {
    if (userId === undefined) return;
    const request = ++latest.current;
    void fetchMypage(userId).then((result) => {
      if (request !== latest.current) return;
      if ("error" in result) {
        if (result.error === "usernameRequired") void refreshAccount();
        setState({ kind: "failed", error: result.error });
        return;
      }
      setState({ kind: "loaded", mypage: result });
    });
  }, [userId]);

  useFocusEffect(reload);

  return { state, reload };
}
