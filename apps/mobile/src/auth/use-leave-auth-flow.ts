import { useCallback } from "react";
import { useRouter } from "expo-router";

import { useGoToTab } from "../hooks/use-go-to-tab";

/**
 * ログイン・登録の流れを終えて、流れに入る前の画面へ戻る
 * 認証フローの出口
 *
 * ログイン・登録・ユーザー名の設定は、入口（ホーム・マイページ・会員限定
 * ゲート等）から積んで開き、終えたら 1 画面戻って入口に帰る（流れの中の
 * ログイン ⇄ 登録 ⇄ ユーザー名の設定は置き換えなので、戻る 1 回で入口に
 * 届く）。ディープリンクや再起動で直接開いたときは下に画面が無く、戻ると
 * 何も起きずに認証の画面に残るので、ホームのタブを出す。
 */
export function useLeaveAuthFlow(): () => void {
  const router = useRouter();
  const goToTab = useGoToTab();
  return useCallback(() => {
    if (router.canGoBack()) router.back();
    else goToTab("/");
  }, [router, goToTab]);
}
