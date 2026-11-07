"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/app/[locale]/(user)/_components/button";
import { GoogleIcon } from "@/app/[locale]/(user)/_components/icons/google-icon";
import { toastOnArrival } from "@/app/_components/_lib/toast-on-arrival";
import { localizedHref } from "@/i18n/public-path";
import { createClient } from "@/lib/supabase/client";

import { useSupportedLocale } from "../_lib/use-supported-locale";

const LABEL_KEYS = {
  signIn: { idle: "googleOAuth", loading: "googleOAuthLoading" },
  signUp: { idle: "googleOAuthSignUp", loading: "googleOAuthSignUpLoading" },
} as const;

/**
 * Google OAuth サインインボタン
 *
 * `/auth/callback` には `locale`（ページの言語）と `next`（ページの言語の公開 URL）を
 * 付ける。コールバックは `app/[locale]` の外にあり言語を URL から知れないので、
 * ユーザー名が未設定のとき（`next` を捨てて setup-username へ送る経路）や
 * 失敗の着地も `locale` で言語を保つ。`Accept-Language`・cookie では推測しない。
 *
 * @param redirectTo ログイン成功時の遷移先（公開 URL の形。英語なら `/en/...`）。
 *   未指定ならページの言語の `/mypage`。
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
  const locale = useSupportedLocale();
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    const supabase = createClient();
    setIsLoading(true);
    try {
      const next = redirectTo ?? localizedHref("/mypage", locale);
      // `/auth/callback` はロケール化しないパス（`/en/auth/callback` は無い）
      const callbackUrl = new URL("/auth/callback", window.location.origin);
      callbackUrl.searchParams.set("locale", locale);
      callbackUrl.searchParams.set("next", next);
      // Google から戻って着いた先で出す。ユーザー名が未設定（新規登録）なら
      // コールバックがユーザー名の設定へ送り、着地先が違うので預かりは捨てられる
      // （そちらは設定を終えたときに「登録が完了しました」を出す）
      toastOnArrival(next, t("signInSuccess"), "success");
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
