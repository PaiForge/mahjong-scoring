/**
 * アカウント登録ページ
 *
 * @description
 * Google OAuth またはメールアドレス/パスワードによるユーザー登録ページ。
 * OAuth ではサインアップとサインインが同一操作（signInWithOAuth）のため、
 * 既存ユーザーがこのページから認証した場合はサイレントにログインされる。
 * これは業界標準の挙動であり、アカウント列挙攻撃の防止にもなる。
 *
 * @flow
 * 1. ユーザーが Google OAuth またはメールフォームで登録
 * 2. メール登録の場合 → 確認メール送信 → verify-email ページへ遷移
 * 3. OAuth の場合 → /auth/callback → /mypage
 */
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ContentContainer } from "@/app/_components/content-container";
import { PageTitle } from "@/app/_components/page-title";
import { createMetadata } from "@/app/_lib/metadata";
import { getOptionalUser } from "@/lib/auth";

import { GoogleOAuthButton } from "../sign-in/_components/google-oauth-button";
import { EmailSignUpForm } from "./_components/email-sign-up-form";

/** 認証状態に依存するため、ビルド時のプリレンダリングを無効化 */
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("signUp");
  return createMetadata({ title: t("pageTitle") });
}

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getOptionalUser();

  if (user) {
    redirect("/mypage");
  }

  const { error } = await searchParams;
  const t = await getTranslations("signUp");
  const tAuth = await getTranslations("auth");

  return (
    <ContentContainer>
      <PageTitle>{t("pageTitle")}</PageTitle>
      <div className="mt-8 space-y-6">
        {error && (
          <p className="text-center text-sm text-red-600">
            {tAuth("authError")}
          </p>
        )}
        <GoogleOAuthButton />

        <div className="flex items-center gap-4 max-w-sm mx-auto">
          <div className="flex-1 border-t border-surface-200" />
          <span className="text-sm text-surface-500">{tAuth("or")}</span>
          <div className="flex-1 border-t border-surface-200" />
        </div>

        <EmailSignUpForm />

        <p className="text-center text-sm text-surface-500">
          {tAuth("alreadyHaveAccount")}
          <Link href="/sign-in" className="text-primary hover:underline">
            {tAuth("signInLinkText")}
          </Link>
        </p>
      </div>
    </ContentContainer>
  );
}
