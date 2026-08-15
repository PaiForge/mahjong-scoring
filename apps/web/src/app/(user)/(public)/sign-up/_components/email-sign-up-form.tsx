"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { MIN_PASSWORD_LENGTH } from "@/config";

import { useAuthFormSubmit } from "../../_hooks/use-auth-form-submit";
import { usePasswordFormMessages } from "../../_hooks/use-password-form-messages";
import { AuthTextField } from "../../_components/auth-text-field";
import { AuthSubmitButton } from "../../_components/auth-submit-button";
import { AuthFormError } from "../../_components/auth-form-error";
import { signUp } from "../_actions/sign-up";

/**
 * メールアドレス/パスワードによるサインアップフォーム
 * メール登録フォーム
 */
export function EmailSignUpForm() {
  const t = useTranslations("signUp");
  const { validatePair, mapPasswordError } = usePasswordFormMessages("signUp");
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { error, isLoading, submit } = useAuthFormSubmit();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void submit({
      validate: () => validatePair(password, confirmPassword),
      action: () => signUp(email, password),
      mapError: (code) =>
        mapPasswordError(code) ??
        (code === "rateLimited" ? t("rateLimited") : t("emailSignUpError")),
      onSuccess: () => {
        router.push(`/sign-up/verify-email?email=${encodeURIComponent(email)}`);
      },
    });
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm mx-auto space-y-4">
      <AuthFormError message={error} />

      <AuthTextField
        id="signup-email"
        label={t("emailLabel")}
        type="email"
        value={email}
        onChange={setEmail}
        autoComplete="email"
        placeholder={t("emailPlaceholder")}
      />

      <AuthTextField
        id="signup-password"
        label={t("passwordLabel")}
        type="password"
        value={password}
        onChange={setPassword}
        minLength={MIN_PASSWORD_LENGTH}
        autoComplete="new-password"
        placeholder={t("passwordPlaceholder")}
      />

      <AuthTextField
        id="signup-confirm-password"
        label={t("confirmPasswordLabel")}
        type="password"
        value={confirmPassword}
        onChange={setConfirmPassword}
        minLength={MIN_PASSWORD_LENGTH}
        autoComplete="new-password"
        placeholder={t("confirmPasswordPlaceholder")}
      />

      <AuthSubmitButton loading={isLoading}>
        {isLoading ? t("emailSignUpLoading") : t("emailSignUp")}
      </AuthSubmitButton>
    </form>
  );
}
