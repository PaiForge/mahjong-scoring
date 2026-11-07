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
 * 3. 成功時は /mypage へ遷移（英語のページからは `/en/mypage`）
 */
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { ContentContainer } from "@/app/[locale]/(user)/_components/content-container";
import { PageTitle } from "@/app/[locale]/(user)/_components/page-title";

import { createAuthPageMetadata } from "../sign-in/_lib/auth-page-metadata";
import { ResetPasswordForm } from "./_components/reset-password-form";
import { prepareRouteLocale } from "@/i18n/route-locale";

const PATH = "/reset-password";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/reset-password">): Promise<Metadata> {
  const locale = await prepareRouteLocale(params, PATH);
  return createAuthPageMetadata("resetPassword", "pageTitle", PATH, locale);
}

export default async function ResetPasswordPage({
  params,
}: PageProps<"/[locale]/reset-password">) {
  await prepareRouteLocale(params, PATH);
  const t = await getTranslations("resetPassword");

  return (
    <ContentContainer>
      <PageTitle>{t("pageTitle")}</PageTitle>
      <div className="space-y-6">
        <p className="text-center text-sm text-surface-500">
          {t("description")}
        </p>
        <ResetPasswordForm />
      </div>
    </ContentContainer>
  );
}
