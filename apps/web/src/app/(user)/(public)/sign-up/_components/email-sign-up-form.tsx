"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { MIN_PASSWORD_LENGTH } from "@/config";
import {
  isPasswordValidationErrorKey,
  validatePasswordPair,
} from "@/lib/validations/password";

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
  const tPassword = useTranslations("validation.password");
  const router = useRouter();
  const [email, setEmail] = useState("");
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

    try {
      const result = await signUp(email, password);

      if ("error" in result) {
        const serverError = result.error;
        if (serverError.startsWith("password:")) {
          const key = serverError.slice("password:".length);
          if (isPasswordValidationErrorKey(key)) {
            setError(tPassword(key, { minLength: MIN_PASSWORD_LENGTH }));
          } else {
            setError(t("emailSignUpError"));
          }
        } else {
          switch (serverError) {
            case "rateLimited":
              setError(t("rateLimited"));
              break;
            default:
              setError(t("emailSignUpError"));
          }
        }
        setIsLoading(false);
        return;
      }

      router.push(`/sign-up/verify-email?email=${encodeURIComponent(email)}`);
    } catch {
      setError(t("emailSignUpError"));
      setIsLoading(false);
    }
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
