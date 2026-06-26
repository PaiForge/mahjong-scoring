"use client";

import { useState } from "react";

import { useTranslations } from "next-intl";

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
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await forgotPassword(email);

      if ("error" in result) {
        switch (result.error) {
          case "rateLimited":
            setError(t("rateLimited"));
            break;
          default:
            setError(t("error"));
        }
        setIsLoading(false);
        return;
      }

      setIsSent(true);
      setIsLoading(false);
    } catch {
      setError(t("error"));
      setIsLoading(false);
    }
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
