"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { MIN_PASSWORD_LENGTH } from "@/config";
import {
  parsePasswordActionError,
  validatePasswordPair,
} from "@/lib/validations/password";

import { useAuthFormSubmit } from "../../_hooks/use-auth-form-submit";
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
  const { error, isLoading, submit } = useAuthFormSubmit();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void submit({
      validate: () => {
        const pairError = validatePasswordPair(password, confirmPassword);
        if (!pairError) return undefined;
        return pairError.type === "mismatch"
          ? t("passwordMismatch")
          : tPassword(pairError.key, { minLength: MIN_PASSWORD_LENGTH });
      },
      action: () => resetPassword(password),
      mapError: (code) => {
        if (code === "rateLimited") return t("rateLimited");
        const passwordKey = parsePasswordActionError(code);
        if (passwordKey) {
          return tPassword(passwordKey, { minLength: MIN_PASSWORD_LENGTH });
        }
        return t("error");
      },
      onSuccess: () => {
        router.push("/mypage");
      },
    });
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
