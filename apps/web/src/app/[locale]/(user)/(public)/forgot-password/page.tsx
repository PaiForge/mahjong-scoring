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
 *
 * メールは日英併記で、英語のボタン（`locale=en` 付き）は `/en/reset-password` に着く。
 */
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { resolveNavTargetFor } from "@/app/[locale]/(user)/_components/_lib/locale-nav-target";
import { ContentContainer } from "@/app/[locale]/(user)/_components/content-container";
import { PageTitle } from "@/app/[locale]/(user)/_components/page-title";

import { createAuthPageMetadata } from "../sign-in/_lib/auth-page-metadata";
import { ForgotPasswordForm } from "./_components/forgot-password-form";
import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import { prepareRouteLocale } from "@/i18n/route-locale";

const PATH = "/forgot-password";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/forgot-password">): Promise<Metadata> {
  const locale = await prepareRouteLocale(params, "/forgot-password");
  return createAuthPageMetadata("forgotPassword", "pageTitle", PATH, locale);
}

export default async function ForgotPasswordPage({
  params,
}: PageProps<"/[locale]/forgot-password">) {
  const locale = await prepareRouteLocale(params, "/forgot-password");
  const t = await getTranslations("forgotPassword");
  const signIn = resolveNavTargetFor("/sign-in", locale);

  return (
    <ContentContainer>
      <PageTitle>{t("pageTitle")}</PageTitle>
      <div className="space-y-6">
        <ForgotPasswordForm />

        <p className="text-center text-sm text-surface-500">
          <Link href={signIn.href} className={TEXT_LINK_CLASSES}>
            {t("backToSignIn")}
          </Link>
        </p>
      </div>
    </ContentContainer>
  );
}
