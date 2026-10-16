"use client";

import { useState } from "react";

import { useTranslations } from "next-intl";
import { useResendCooldown } from "@mahjong-scoring/features/account/use-resend-cooldown";

import { resendEmail } from "../_actions/resend-email";
import { resendEmailMessageKey } from "../_lib/resend-email-message";
import { Button } from "@/app/(user)/_components/button";

/**
 * 確認メール再送ボタン。60秒のクールダウン付き（アプリの確認メールの案内と共有）。
 * メール再送ボタン
 */
export function ResendEmailButton({ email }: { readonly email: string }) {
  const t = useTranslations("verifyEmail");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const { cooldown, start: startCooldown } = useResendCooldown();

  const handleResend = async () => {
    setIsLoading(true);
    setMessage("");

    try {
      const result = await resendEmail(email);

      if ("error" in result) {
        setMessage(t(resendEmailMessageKey(result.error)));
      } else {
        setMessage(t("resendSuccess"));
        startCooldown();
      }
    } catch {
      setMessage(t("resendError"));
    }

    setIsLoading(false);
  };

  const isDisabled = isLoading || !email || cooldown > 0;

  return (
    // 直下の Google ボタン・認証フォームの送信ボタンと同じ幅と大きさに揃える
    <div className="mx-auto w-full max-w-sm space-y-2 text-center">
      <Button size="lg" fullWidth onClick={handleResend} disabled={isDisabled}>
        {isLoading
          ? t("resendLoading")
          : cooldown > 0
            ? t("resendCooldown", { seconds: cooldown })
            : t("resendButton")}
      </Button>
      {message && <p className="text-sm text-surface-500">{message}</p>}
    </div>
  );
}
