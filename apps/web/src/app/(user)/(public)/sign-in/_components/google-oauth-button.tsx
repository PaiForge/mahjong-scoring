"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/app/(user)/_components/button";
import { GoogleIcon } from "@/app/(user)/_components/icons/google-icon";
import { toastOnArrival } from "@/app/_components/_lib/toast-on-arrival";
import { createClient } from "@/lib/supabase/client";

const LABEL_KEYS = {
  signIn: { idle: "googleOAuth", loading: "googleOAuthLoading" },
  signUp: { idle: "googleOAuthSignUp", loading: "googleOAuthSignUpLoading" },
} as const;

/**
 * Google OAuth サインインボタン
 *
 * @param redirectTo ログイン成功時の遷移先。未指定または無効な場合は `/mypage`。
 *   `page.tsx` 側で `sanitizeInternalRedirect` 済みの値を受け取る想定。
 *   `/auth/callback` に `next` クエリとして渡し、コールバック内で再検証される。
 * @param intent ラベルの出し分け。OAuth は登録とログインが同じ操作なので、
 *   挙動は変わらず文言だけが変わる。登録の画面では `"signUp"` を渡す。
 */
export function GoogleOAuthButton({
  redirectTo,
  intent = "signIn",
}: {
  readonly redirectTo?: string;
  readonly intent?: "signIn" | "signUp";
}) {
  const t = useTranslations("auth");
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    const supabase = createClient();
    setIsLoading(true);
    try {
      const callbackUrl = new URL("/auth/callback", window.location.origin);
      if (redirectTo) {
        callbackUrl.searchParams.set("next", redirectTo);
      }
      // Google から戻って着いた先で出す。ユーザー名が未設定（新規登録）なら
      // コールバックがユーザー名の設定へ送り、着地先が違うので預かりは捨てられる
      // （そちらは設定を終えたときに「登録が完了しました」を出す）
      toastOnArrival(redirectTo ?? "/mypage", t("signInSuccess"), "success");
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: callbackUrl.toString(),
        },
      });
    } catch {
      setIsLoading(false);
    }
  };

  return (
    // Button は inline-flex のため mx-auto では中央に寄らない。
    // 幅を絞ったうえで中央寄せするラッパーで包む。
    <div className="mx-auto w-full max-w-sm">
      <Button
        variant="neutral"
        size="lg"
        fullWidth
        onClick={handleClick}
        disabled={isLoading}
        className="gap-3"
      >
        <GoogleIcon />
        <span className="text-sm font-medium text-surface-700">
          {t(isLoading ? LABEL_KEYS[intent].loading : LABEL_KEYS[intent].idle)}
        </span>
      </Button>
    </div>
  );
}
