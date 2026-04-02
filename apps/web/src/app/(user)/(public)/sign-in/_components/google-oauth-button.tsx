"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { GoogleIcon } from "@/app/_components/icons/google-icon";
import { createClient } from "@/lib/supabase/client";

/**
 * Google OAuth サインインボタン
 */
export function GoogleOAuthButton() {
  const t = useTranslations("auth");
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    const supabase = createClient();
    setIsLoading(true);
    try {
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
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
