/**
 * ログインページ
 *
 * @description
 * Google OAuth またはメールアドレス/パスワードによるログインページ。
 * メール認証では汎用エラーメッセージを返し、アカウント列挙攻撃を防止する。
 *
 * @flow
 * 1. ユーザーが Google OAuth またはメールフォームでログイン
 * 2. OAuth の場合 → /auth/callback → /mypage
 * 3. メール認証成功の場合 → Cookie 同期のためハードナビゲーションで /mypage へ
 */
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ContentContainer } from "@/app/_components/content-container";
import { PageTitle } from "@/app/_components/page-title";
import { createMetadata } from "@/app/_lib/metadata";
import { getOptionalUser } from "@/lib/auth";

import { EmailPasswordForm } from "./_components/email-password-form";
import { GoogleOAuthButton } from "./_components/google-oauth-button";

/** 認証状態に依存するため、ビルド時のプリレンダリングを無効化 */
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");
  return createMetadata({ title: t("signInPageTitle") });
}

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getOptionalUser();

  if (user) {
    redirect("/mypage");
  }

  const { error } = await searchParams;
  const t = await getTranslations("auth");

  return (
    <ContentContainer>
      <PageTitle>{t("signInPageTitle")}</PageTitle>
      <div className="mt-8 space-y-6">
        {error && (
          <p className="text-center text-sm text-red-600">{t("authError")}</p>
        )}
        <GoogleOAuthButton />

        <div className="flex items-center gap-4 max-w-sm mx-auto">
          <div className="flex-1 border-t border-surface-200" />
          <span className="text-sm text-surface-500">{t("or")}</span>
          <div className="flex-1 border-t border-surface-200" />
        </div>

        <EmailPasswordForm />

        <p className="text-center text-sm text-surface-500">
          {t("noAccountYet")}
          <Link href="/sign-up" className="text-primary hover:underline">
            {t("signUpLinkText")}
          </Link>
        </p>
      </div>
    </ContentContainer>
  );
}
