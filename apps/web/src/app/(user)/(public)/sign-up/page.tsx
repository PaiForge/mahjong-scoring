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
 *
 * 利用規約への同意は、登録の手段（Google・メール）より上に置いた一文で取る。
 * どの手段で登録しても、押す前に必ず目に入る位置に置くため。
 */
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { ContentContainer } from "@/app/(user)/_components/content-container";
import { PageTitle } from "@/app/(user)/_components/page-title";
import { createTitleOnlyMetadata } from "@/app/_lib/metadata";
import { redirectIfAuthenticated } from "@/lib/auth";

import { GoogleOAuthButton } from "../sign-in/_components/google-oauth-button";
import { EmailSignUpForm } from "./_components/email-sign-up-form";
import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";

/** 認証状態に依存するため、ビルド時のプリレンダリングを無効化 */
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return createTitleOnlyMetadata("signUp", "pageTitle");
}

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await redirectIfAuthenticated();

  const { error } = await searchParams;
  const t = await getTranslations("signUp");
  const tAuth = await getTranslations("auth");

  return (
    <ContentContainer>
      <PageTitle>
        {t("pageTitle")}
        <span className="ml-2 align-middle" aria-label={t("freeBadge")}>
          🆓
        </span>
      </PageTitle>
      <div className="space-y-6">
        {error && (
          <p className="text-center text-sm text-destructive">
            {tAuth("authError")}
          </p>
        )}
        <p className="text-center text-sm leading-relaxed text-surface-500">
          {t.rich("consent", {
            terms: (chunks) => (
              <Link href="/terms" className={TEXT_LINK_CLASSES}>
                {chunks}
              </Link>
            ),
            privacy: (chunks) => (
              <Link href="/privacy" className={TEXT_LINK_CLASSES}>
                {chunks}
              </Link>
            ),
          })}
        </p>
        <div className="space-y-2">
          <GoogleOAuthButton intent="signUp" />
          <p className="text-center text-xs text-success">
            <span aria-hidden="true">&#x2713;</span> {t("freeAssurance")}
          </p>
        </div>

        <div className="flex items-center gap-4 max-w-sm mx-auto">
          <div className="flex-1 border-t border-panel" />
          <span className="text-sm text-surface-500">{tAuth("or")}</span>
          <div className="flex-1 border-t border-panel" />
        </div>

        <EmailSignUpForm />

        <p className="text-center text-sm text-surface-500">
          {tAuth("alreadyHaveAccount")}
          <Link href="/sign-in" className={TEXT_LINK_CLASSES}>
            {tAuth("signInLinkText")}
          </Link>
        </p>
      </div>
    </ContentContainer>
  );
}
