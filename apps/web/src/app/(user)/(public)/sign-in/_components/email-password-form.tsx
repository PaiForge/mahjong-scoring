"use client";

import { useState } from "react";

import Link from "next/link";
import { useTranslations } from "next-intl";

import { useAuthFormSubmit } from "../../_hooks/use-auth-form-submit";
import { AuthTextField } from "../../_components/auth-text-field";
import { AuthSubmitButton } from "../../_components/auth-submit-button";
import { AuthFormError } from "../../_components/auth-form-error";
import { signIn } from "../_actions/sign-in";

/**
 * メールアドレス/パスワードによるサインインフォーム
 * メールログインフォーム
 *
 * @param redirectTo ログイン成功時の遷移先。未指定または無効な場合は `/mypage`。
 *   `page.tsx` 側で `sanitizeInternalRedirect` 済みの値を受け取る想定。
 */
export function EmailPasswordForm({ redirectTo }: { redirectTo?: string }) {
  const t = useTranslations("auth");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { error, isLoading, submit } = useAuthFormSubmit();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void submit({
      action: () => signIn(email, password),
      mapError: (code) =>
        code === "rateLimited" ? t("rateLimited") : t("emailSignInError"),
      onSuccess: () => {
        // Hard navigation で Cookie の同期を確実にする。
        // router.push だと Server Component が Cookie 反映前にレンダリングされる可能性がある。
        window.location.href = redirectTo ?? "/mypage";
      },
    });
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm mx-auto space-y-4">
      <AuthFormError message={error} />

      <AuthTextField
        id="signin-email"
        label={t("emailLabel")}
        type="email"
        value={email}
        onChange={setEmail}
        autoComplete="email"
        placeholder={t("emailPlaceholder")}
      />

      <AuthTextField
        id="signin-password"
        label={t("passwordLabel")}
        type="password"
        value={password}
        onChange={setPassword}
        autoComplete="current-password"
        placeholder={t("passwordPlaceholder")}
      />

      <AuthSubmitButton loading={isLoading}>
        {isLoading ? t("emailSignInLoading") : t("emailSignIn")}
      </AuthSubmitButton>

      <p className="text-center text-sm">
        <Link href="/forgot-password" className="text-primary hover:underline">
          {t("forgotPasswordLink")}
        </Link>
      </p>
    </form>
  );
}
