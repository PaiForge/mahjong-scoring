import { useEffect } from "react";
import { AppState } from "react-native";
import { useTranslations } from "use-intl";

import { useAuth } from "../auth/use-auth";
import { showToast } from "../components/toast";
import { onGuestLessonsRecorded, syncAccountRecords } from "./account-sync";

/**
 * ログイン中のアカウントの預かりを送り、進み具合を読み直す（ルートで 1 回だけ呼ぶ）
 * アカウント同期フック
 *
 * ログインしたとき（起動時に保存済みのログインが戻ったときを含む）と、
 * アプリが前面に戻ったときに送る。ゲストのあいだは何もしない。
 * ゲストのときに終えたレッスンを記録できたらトーストで知らせる（web の
 * ダッシュボードと同じ文言）ので、辞書の Provider の内側で呼ぶ。
 */
export function useAccountSync(): void {
  const { status, user } = useAuth();
  const userId = status === "signedIn" ? user?.id : undefined;
  const t = useTranslations("dashboard.pendingLessons");

  useEffect(
    () => onGuestLessonsRecorded(() => showToast(t("synced"), "success")),
    [t],
  );

  useEffect(() => {
    if (userId === undefined) return;
    void syncAccountRecords(userId);
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") void syncAccountRecords(userId);
    });
    return () => sub.remove();
  }, [userId]);
}
