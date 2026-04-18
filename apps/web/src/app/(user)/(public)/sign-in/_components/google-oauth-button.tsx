"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { GoogleIcon } from "@/app/_components/icons/google-icon";
import { createClient } from "@/lib/supabase/client";

/**
 * Google OAuth サインインボタン
 *
 * @param redirectTo ログイン成功時の遷移先。未指定または無効な場合は `/mypage`。
 *   `page.tsx` 側で `sanitizeInternalRedirect` 済みの値を受け取る想定。
 *   `/auth/callback` に `next` クエリとして渡し、コールバック内で再検証される。
 */
export function GoogleOAuthButton({
  redirectTo,
}: {
  redirectTo?: string;
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
    <button
      onClick={handleClick}
      disabled={isLoading}
      className="flex items-center justify-center gap-3 w-full max-w-sm mx-auto px-6 py-3 bg-white border border-surface-200 rounded-lg shadow-sm hover:shadow-md transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <GoogleIcon />
      <span className="text-sm font-medium text-surface-700">
        {isLoading ? t("googleOAuthLoading") : t("googleOAuth")}
      </span>
    </button>
  );
}
