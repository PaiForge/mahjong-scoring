"use client";

import { useState } from "react";

import { useTranslations } from "next-intl";

import { useAuthFormSubmit } from "../../_hooks/use-auth-form-submit";
import { AuthTextField } from "../../_components/auth-text-field";
import { AuthSubmitButton } from "../../_components/auth-submit-button";
import { AuthFormError } from "../../_components/auth-form-error";
import { forgotPassword } from "../_actions/forgot-password";

/**
 * パスワードリセットリンク送信フォーム
 * パスワードリセットフォーム
 */
export function ForgotPasswordForm() {
  const t = useTranslations("forgotPassword");
  const [email, setEmail] = useState("");
  const [isSent, setIsSent] = useState(false);
  const { error, isLoading, submit } = useAuthFormSubmit();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void submit({
      action: () => forgotPassword(email),
      mapError: (code) =>
        code === "rateLimited" ? t("rateLimited") : t("error"),
      onSuccess: () => {
        setIsSent(true);
      },
      stopLoadingOnSuccess: true,
    });
  };

  if (isSent) {
    return (
      <div className="w-full max-w-sm mx-auto text-center space-y-3">
        <p className="text-surface-700">{t("sentDescription")}</p>
        <p className="text-sm text-surface-500">{t("checkInbox")}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm mx-auto space-y-4">
      <AuthFormError message={error} />

      <p className="text-sm text-surface-500">{t("description")}</p>

      <AuthTextField
        id="forgot-email"
        label={t("emailLabel")}
        type="email"
        value={email}
        onChange={setEmail}
        autoComplete="email"
        placeholder={t("emailPlaceholder")}
      />

      <AuthSubmitButton loading={isLoading}>
        {isLoading ? t("submitLoading") : t("submit")}
      </AuthSubmitButton>
    </form>
  );
}
