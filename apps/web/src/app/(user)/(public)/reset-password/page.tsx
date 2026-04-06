/**
 * パスワード再設定ページ
 *
 * @description
 * パスワードリセットメールのリンクから遷移する新パスワード設定ページ。
 * クライアントサイドで supabase.auth.updateUser を呼び出してパスワードを更新する。
 *
 * @flow
 * 1. /auth/callback?type=recovery でセッション確立後にリダイレクト
 * 2. 新パスワードを入力して送信
 * 3. 成功時は /mypage へ遷移
 */
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { ContentContainer } from "@/app/_components/content-container";
import { PageTitle } from "@/app/_components/page-title";
import { createMetadata } from "@/app/_lib/metadata";

import { ResetPasswordForm } from "./_components/reset-password-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("resetPassword");
  return createMetadata({ title: t("pageTitle") });
}

export default async function ResetPasswordPage() {
  const t = await getTranslations("resetPassword");

  return (
    <ContentContainer>
      <PageTitle>{t("pageTitle")}</PageTitle>
      <div className="mt-8 space-y-6">
        <p className="text-center text-sm text-surface-500">
          {t("description")}
        </p>
        <ResetPasswordForm />
      </div>
    </ContentContainer>
  );
}
