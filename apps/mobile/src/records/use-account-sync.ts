import { useEffect } from "react";
import { AppState } from "react-native";

import { useAuth } from "../auth/use-auth";
import { syncAccountRecords } from "./account-sync";

/**
 * ログイン中のアカウントの預かりを送り、進み具合を読み直す（ルートで 1 回だけ呼ぶ）
 * アカウント同期フック
 *
 * ログインしたとき（起動時に保存済みのログインが戻ったときを含む）と、
 * アプリが前面に戻ったときに送る。ゲストのあいだは何もしない。
 */
export function useAccountSync(): void {
  const { status, user } = useAuth();
  const userId = status === "signedIn" ? user?.id : undefined;

  useEffect(() => {
    if (userId === undefined) return;
    void syncAccountRecords(userId);
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") void syncAccountRecords(userId);
    });
    return () => sub.remove();
  }, [userId]);
}
