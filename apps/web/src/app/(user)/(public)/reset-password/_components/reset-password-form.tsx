"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { MIN_PASSWORD_LENGTH } from "@/config";
import { validatePasswordPair } from "@/lib/validations/password";

import { AuthTextField } from "../../_components/auth-text-field";
import { AuthSubmitButton } from "../../_components/auth-submit-button";
import { AuthFormError } from "../../_components/auth-form-error";
import { resetPassword } from "../_actions/reset-password";

/**
 * パスワード再設定フォーム。
 * Server Action 経由で Supabase の updateUser を呼び出す。
 * パスワード再設定フォーム
 */
export function ResetPasswordForm() {
  const t = useTranslations("resetPassword");
  const tPassword = useTranslations("validation.password");
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const pairError = validatePasswordPair(password, confirmPassword);
    if (pairError) {
      setError(
        pairError.type === "mismatch"
          ? t("passwordMismatch")
          : tPassword(pairError.key, { minLength: MIN_PASSWORD_LENGTH }),
      );
      return;
    }

    setIsLoading(true);

    const result = await resetPassword(password);

    if ("error" in result) {
      if (result.error === "rateLimited") {
        setError(t("rateLimited"));
      } else if (result.error.startsWith("password:")) {
        const key = result.error.replace("password:", "");
        setError(tPassword(key, { minLength: MIN_PASSWORD_LENGTH }));
      } else {
        setError(t("error"));
      }
      setIsLoading(false);
      return;
    }

    router.push("/mypage");
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm mx-auto space-y-4">
      <AuthFormError message={error} />

      <AuthTextField
        id="reset-password"
        label={t("passwordLabel")}
        type="password"
        value={password}
        onChange={setPassword}
        minLength={MIN_PASSWORD_LENGTH}
        autoComplete="new-password"
        placeholder={t("passwordPlaceholder")}
      />

      <AuthTextField
        id="reset-confirm-password"
        label={t("confirmPasswordLabel")}
        type="password"
        value={confirmPassword}
        onChange={setConfirmPassword}
        minLength={MIN_PASSWORD_LENGTH}
        autoComplete="new-password"
        placeholder={t("confirmPasswordPlaceholder")}
      />

      <AuthSubmitButton loading={isLoading}>
        {isLoading ? t("submitLoading") : t("submit")}
      </AuthSubmitButton>
    </form>
  );
}
