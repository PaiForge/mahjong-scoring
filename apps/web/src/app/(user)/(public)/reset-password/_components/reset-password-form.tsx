"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { MIN_PASSWORD_LENGTH } from "@/config";
import { getPasswordValidationError } from "@/lib/validations/password";

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

    if (password !== confirmPassword) {
      setError(t("passwordMismatch"));
      return;
    }

    const passwordError = getPasswordValidationError(password);
    if (passwordError) {
      setError(tPassword(passwordError, { minLength: MIN_PASSWORD_LENGTH }));
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
      {error && (
        <p className="text-center text-sm text-red-600">{error}</p>
      )}

      <div>
        <label
          htmlFor="reset-password"
          className="block text-sm font-medium text-surface-700 mb-1"
        >
          {t("passwordLabel")}
        </label>
        <input
          id="reset-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={MIN_PASSWORD_LENGTH}
          autoComplete="new-password"
          className="w-full px-3 py-2 bg-white border border-surface-200 rounded-lg text-surface-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          placeholder={t("passwordPlaceholder")}
        />
      </div>

      <div>
        <label
          htmlFor="reset-confirm-password"
          className="block text-sm font-medium text-surface-700 mb-1"
        >
          {t("confirmPasswordLabel")}
        </label>
        <input
          id="reset-confirm-password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={MIN_PASSWORD_LENGTH}
          autoComplete="new-password"
          className="w-full px-3 py-2 bg-white border border-surface-200 rounded-lg text-surface-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          placeholder={t("confirmPasswordPlaceholder")}
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full px-6 py-3 bg-primary text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? t("submitLoading") : t("submit")}
      </button>
    </form>
  );
}
