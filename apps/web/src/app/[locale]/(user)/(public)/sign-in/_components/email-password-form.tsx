"use client";

import { useState } from "react";

import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { localizedHref } from "@/i18n/public-path";

import { useAuthFormSubmit } from "../../_hooks/use-auth-form-submit";
import { AuthTextField } from "../../_components/auth-text-field";
import { AuthSubmitButton } from "../../_components/auth-submit-button";
import { AuthFormError } from "../../_components/auth-form-error";
import { signIn } from "../_actions/sign-in";
import { useSupportedLocale } from "../_lib/use-supported-locale";
import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import { toastOnArrival } from "@/app/_components/_lib/toast-on-arrival";

/**
 * メールアドレス/パスワードによるサインインフォーム
 * メールログインフォーム
 *
 * @param redirectTo ログイン成功時の遷移先（公開 URL の形。英語なら `/en/...`）。
 *   未指定ならページの言語の `/mypage`（英語なら `/en/mypage`）。
 *   `page.tsx` 側で `sanitizeInternalRedirect` 済みの値を受け取る想定。
 *   読み込み直す遷移（`window.location.href`）なので、言語の接頭辞は
 *   next-intl の遷移に任せられず、ここで最終の URL にする。
 */
export function EmailPasswordForm({ redirectTo }: { redirectTo?: string }) {
  const t = useTranslations("auth");
  const locale = useSupportedLocale();
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
        const next = redirectTo ?? localizedHref("/mypage", locale);
        // 読み込み直した先で出す（預かりは sessionStorage を経由して残る）
        toastOnArrival(next, t("signInSuccess"), "success");
        // Hard navigation で Cookie の同期を確実にする。
        // router.push だと Server Component が Cookie 反映前にレンダリングされる可能性がある。
        window.location.href = next;
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
        <Link href="/forgot-password" className={TEXT_LINK_CLASSES}>
          {t("forgotPasswordLink")}
        </Link>
      </p>
    </form>
  );
}
