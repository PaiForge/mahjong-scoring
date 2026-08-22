"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/app/_components/button";
import { GoogleIcon } from "@/app/_components/icons/google-icon";
import { createClient } from "@/lib/supabase/client";

/**
 * Google OAuth サインインボタン
 *
 * @param redirectTo ログイン成功時の遷移先。未指定または無効な場合は `/mypage`。
 *   `page.tsx` 側で `sanitizeInternalRedirect` 済みの値を受け取る想定。
 *   `/auth/callback` に `next` クエリとして渡し、コールバック内で再検証される。
 */
export function GoogleOAuthButton({ redirectTo }: { redirectTo?: string }) {
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
    <Button
      variant="neutral"
      size="lg"
      fullWidth
      onClick={handleClick}
      disabled={isLoading}
      className="mx-auto max-w-sm gap-3"
    >
      <GoogleIcon />
      <span className="text-sm font-medium text-surface-700">
        {isLoading ? t("googleOAuthLoading") : t("googleOAuth")}
      </span>
    </Button>
  );
}
