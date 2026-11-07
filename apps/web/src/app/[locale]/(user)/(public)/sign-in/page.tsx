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
 *
 * 英語のページ（`/en/sign-in`）では着地とリンクを英語のページ（`/en/mypage`・
 * `/en/sign-up`）にする。既定の戻り先はフォームと OAuth のボタンがページの言語の
 * マイページ（`localizedHref`）にする（OAuth はさらに `/auth/callback` へ `locale` を付ける）。
 * 問い合わせ（`/contact`）は英語で未公開のため、「日本語のみ」の印付きで日本語の
 * ページへ張る。
 */
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { resolveNavTargetFor } from "@/app/[locale]/(user)/_components/_lib/locale-nav-target";
import { ContentContainer } from "@/app/[locale]/(user)/_components/content-container";
import {
  JapaneseOnlyMark,
  LocaleNavLink,
} from "@/app/[locale]/(user)/_components/locale-nav-link";
import { PageTitle } from "@/app/[locale]/(user)/_components/page-title";
import { redirectIfAuthenticated } from "@/lib/auth";
import { sanitizeInternalRedirect } from "@/lib/redirect";

import { EmailPasswordForm } from "./_components/email-password-form";
import { GoogleOAuthButton } from "./_components/google-oauth-button";
import { createAuthPageMetadata } from "./_lib/auth-page-metadata";
import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import { localizedHref } from "@/i18n/public-path";
import { prepareRouteLocale } from "@/i18n/route-locale";

const PATH = "/sign-in";

/** 認証状態に依存するため、ビルド時のプリレンダリングを無効化 */
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/sign-in">): Promise<Metadata> {
  const locale = await prepareRouteLocale(params, PATH);
  return createAuthPageMetadata("auth", "signInPageTitle", PATH, locale);
}

export default async function SignInPage({
  params,
  searchParams,
}: {
  searchParams: Promise<{ error?: string; redirect?: string }>;
} & Pick<PageProps<"/[locale]/sign-in">, "params">) {
  const locale = await prepareRouteLocale(params, PATH);
  const { error, redirect: redirectParam } = await searchParams;
  const mypage = localizedHref("/mypage", locale);
  // `?redirect=` はガードが公開 URL の形（英語なら `/en/...`）で付けるので、
  // 検証したうえでそのまま使う。無いときは undefined のまま渡し、フォームと
  // OAuth のボタンが自分の言語のマイページを既定にする（日本語の RSC の
  // props を従来と同じに保つため、ここで既定値を埋めない）
  const redirectTo = sanitizeInternalRedirect(redirectParam);

  // 既ログインユーザーは redirect クエリを無視して /mypage へ固定遷移。
  // 認証前の意図保持のための redirect を、既ログイン時にも尊重すると
  // GET で副作用のある内部パスへのフィッシング誘導に悪用される恐れがあるため。
  await redirectIfAuthenticated(mypage);

  const [t, tNav] = await Promise.all([
    getTranslations("auth"),
    getTranslations("nav"),
  ]);
  const signUp = resolveNavTargetFor("/sign-up", locale);
  const contact = resolveNavTargetFor("/contact", locale);

  return (
    <ContentContainer>
      <PageTitle>{t("signInPageTitle")}</PageTitle>
      <div className="space-y-6">
        {error && (
          <p className="text-center text-sm text-destructive">
            {error === "email_link_invalid"
              ? t("emailLinkInvalid")
              : t("authError")}
          </p>
        )}
        <GoogleOAuthButton redirectTo={redirectTo} />

        <div className="flex items-center gap-4 max-w-sm mx-auto">
          <div className="flex-1 border-t border-panel" />
          <span className="text-sm text-surface-500">{t("or")}</span>
          <div className="flex-1 border-t border-panel" />
        </div>

        <EmailPasswordForm redirectTo={redirectTo} />

        <p className="text-center text-sm text-surface-500">
          {t("noAccountYet")}
          <Link href={signUp.href} className={TEXT_LINK_CLASSES}>
            {t("signUpLinkText")}
          </Link>
        </p>

        {/* アプリはログインに Apple を持ち、web は持たない。アプリで Apple だけを
            使ってきた人も、パスワードを足せば同じアカウントに入れる */}
        <p className="max-w-sm mx-auto text-xs leading-relaxed text-surface-500">
          {t.rich("appleAccountHint", {
            contact: (chunks) => (
              <LocaleNavLink
                navTarget={contact}
                linkKind="plain"
                className={TEXT_LINK_CLASSES}
              >
                {chunks}
                {contact.crossLocale && (
                  <JapaneseOnlyMark label={tNav("language.japaneseOnly")} />
                )}
              </LocaleNavLink>
            ),
          })}
        </p>
      </div>
    </ContentContainer>
  );
}
