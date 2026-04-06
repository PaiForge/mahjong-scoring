/**
 * パスワードリセットページ
 *
 * @description
 * パスワードを忘れたユーザー向けのリセットリンク送信ページ。
 * アカウント列挙を防ぐため、メールアドレスの存在有無に関わらず成功メッセージを表示する。
 *
 * @flow
 * 1. メールアドレスを入力して送信
 * 2. 送信完了メッセージを表示（常に成功を返す）
 * 3. メール内リンクから /auth/callback?type=recovery → /reset-password へ遷移
 */
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { ContentContainer } from "@/app/_components/content-container";
import { PageTitle } from "@/app/_components/page-title";
import { createMetadata } from "@/app/_lib/metadata";

import { ForgotPasswordForm } from "./_components/forgot-password-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("forgotPassword");
  return createMetadata({ title: t("pageTitle") });
}

export default async function ForgotPasswordPage() {
  const t = await getTranslations("forgotPassword");

  return (
    <ContentContainer>
      <PageTitle>{t("pageTitle")}</PageTitle>
      <div className="mt-8 space-y-6">
        <ForgotPasswordForm />

        <p className="text-center text-sm text-surface-500">
          <Link href="/sign-in" className="text-primary hover:underline">
            {t("backToSignIn")}
          </Link>
        </p>
      </div>
    </ContentContainer>
  );
}
