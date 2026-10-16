"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * 確認メールを再送した後、次に再送できるまでの秒数
 * 再送クールダウン秒数
 *
 * 押し続けて Supabase の送信の回数制限（429）に当たる前に、画面の側で待たせる。
 */
export const RESEND_EMAIL_COOLDOWN_SECONDS = 60;

/**
 * 確認メールの再送のクールダウン（web の確認待ちの画面とアプリの確認メールの案内）
 * 再送クールダウン
 *
 * 再送に成功したら `start()` を呼ぶ。`cooldown` は残りの秒数で、0 になるまで
 * 1 秒ごとに減る。0 より大きい間は再送のボタンを押せなくし、
 * 「再送可能まで {seconds} 秒」（辞書 `verifyEmail.resendCooldown`）を出す。
 */
export function useResendCooldown() {
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const start = useCallback(() => {
    setCooldown(RESEND_EMAIL_COOLDOWN_SECONDS);
  }, []);

  return { cooldown, start };
}
