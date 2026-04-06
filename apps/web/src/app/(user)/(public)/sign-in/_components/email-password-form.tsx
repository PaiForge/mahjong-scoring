"use client";

import { useState } from "react";

import Link from "next/link";
import { useTranslations } from "next-intl";

import { signIn } from "../_actions/sign-in";

/**
 * メールアドレス/パスワードによるサインインフォーム
 * メールログインフォーム
 */
export function EmailPasswordForm() {
  const t = useTranslations("auth");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await signIn(email, password);

      if ("error" in result) {
        switch (result.error) {
          case "rateLimited":
            setError(t("rateLimited"));
            break;
          default:
            setError(t("emailSignInError"));
        }
        setIsLoading(false);
        return;
      }

      // Hard navigation で Cookie の同期を確実にする。
      // router.push だと Server Component が Cookie 反映前にレンダリングされる可能性がある。
      window.location.href = "/mypage";
    } catch {
      setError(t("emailSignInError"));
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm mx-auto space-y-4">
      {error && (
        <p className="text-center text-sm text-red-600">{error}</p>
      )}

      <div>
        <label
          htmlFor="signin-email"
          className="block text-sm font-medium text-surface-700 mb-1"
        >
          {t("emailLabel")}
        </label>
        <input
          id="signin-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          className="w-full px-3 py-2 bg-white border border-surface-200 rounded-lg text-surface-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          placeholder={t("emailPlaceholder")}
        />
      </div>

      <div>
        <label
          htmlFor="signin-password"
          className="block text-sm font-medium text-surface-700 mb-1"
        >
          {t("passwordLabel")}
        </label>
        <input
          id="signin-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          className="w-full px-3 py-2 bg-white border border-surface-200 rounded-lg text-surface-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          placeholder={t("passwordPlaceholder")}
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full px-6 py-3 bg-primary text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? t("emailSignInLoading") : t("emailSignIn")}
      </button>

      <p className="text-center text-sm">
        <Link
          href="/forgot-password"
          className="text-primary hover:underline"
        >
          {t("forgotPasswordLink")}
        </Link>
      </p>
    </form>
  );
}
