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
 *
 * 英語のページ（`/en/sign-up`）では、ログイン・確認待ち・登録後の着地を英語の
 * ページにする。利用規約・プライバシーポリシーは英語で未公開のため、「日本語のみ」の
 * 印付きで日本語のページへ張る（同意の文の中のリンクなので、読めるページの言語を
 * 押す前に示す）。
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

import { GoogleOAuthButton } from "../sign-in/_components/google-oauth-button";
import { createAuthPageMetadata } from "../sign-in/_lib/auth-page-metadata";
import { EmailSignUpForm } from "./_components/email-sign-up-form";
import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import { localizedHref } from "@/i18n/public-path";
import { prepareRouteLocale } from "@/i18n/route-locale";

const PATH = "/sign-up";

/** 認証状態に依存するため、ビルド時のプリレンダリングを無効化 */
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/sign-up">): Promise<Metadata> {
  const locale = await prepareRouteLocale(params, "/sign-up");
  return createAuthPageMetadata("signUp", "pageTitle", PATH, locale);
}

export default async function SignUpPage({
  params,
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
} & Pick<PageProps<"/[locale]/sign-up">, "params">) {
  const locale = await prepareRouteLocale(params, "/sign-up");
  await redirectIfAuthenticated(localizedHref("/mypage", locale));

  const { error } = await searchParams;
  const [t, tAuth, tNav] = await Promise.all([
    getTranslations("signUp"),
    getTranslations("auth"),
    getTranslations("nav"),
  ]);
  const terms = resolveNavTargetFor("/terms", locale);
  const privacy = resolveNavTargetFor("/privacy", locale);
  const signIn = resolveNavTargetFor("/sign-in", locale);
  const japaneseOnly = (
    <JapaneseOnlyMark label={tNav("language.japaneseOnly")} />
  );

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
              <LocaleNavLink
                navTarget={terms}
                linkKind="plain"
                className={TEXT_LINK_CLASSES}
              >
                {chunks}
                {terms.crossLocale && japaneseOnly}
              </LocaleNavLink>
            ),
            privacy: (chunks) => (
              <LocaleNavLink
                navTarget={privacy}
                linkKind="plain"
                className={TEXT_LINK_CLASSES}
              >
                {chunks}
                {privacy.crossLocale && japaneseOnly}
              </LocaleNavLink>
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
          <Link href={signIn.href} className={TEXT_LINK_CLASSES}>
            {tAuth("signInLinkText")}
          </Link>
        </p>
      </div>
    </ContentContainer>
  );
}
