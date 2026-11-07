/**
 * メール確認ページ
 *
 * @description
 * メールアドレスでのサインアップ後に表示される確認ページ。
 * 確認メールが迷惑メールに振り分けられて仮登録のまま離脱するユーザーがいるため、
 * 送信先アドレス・件名・届かないときの確認事項を最初から見せる。再送のほかに、
 * メールに頼らない逃げ道として Google での登録も置く。
 *
 * @flow
 * 1. アカウント登録（メール）の送信後にこのページへ遷移
 * 2. 届いたメールのリンクから /auth/callback を経てアカウントが有効化される
 * 3. 届かなければ確認メールを再送するか、Google アカウントで登録する
 *
 * 確認メールは 1 通で日英を併記する（Supabase は言語別のテンプレートを持たない）。
 * 英語のページから登録した人は、メールの英語のボタン（`locale=en` 付き）から
 * 英語のページへ着く。画面に出す件名（`verifyEmail.mailSubject`）も両言語で同じ
 * 併記の文字列で、実際に届くメールの件名と一致させている。
 */
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { resolveNavTargetFor } from "@/app/[locale]/(user)/_components/_lib/locale-nav-target";
import { ContentContainer } from "@/app/[locale]/(user)/_components/content-container";
import { HighlightPanel } from "@/app/[locale]/(user)/_components/highlight-panel";
import { PageTitle } from "@/app/[locale]/(user)/_components/page-title";
import { SectionTitle } from "@/app/[locale]/(user)/_components/section-title";
import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import { localizedHref } from "@/i18n/public-path";
import { redirectIfAuthenticated } from "@/lib/auth";

import { GoogleOAuthButton } from "../../sign-in/_components/google-oauth-button";
import { createAuthPageMetadata } from "../../sign-in/_lib/auth-page-metadata";
import { ResendEmailButton } from "./_components/resend-email-button";
import { prepareRouteLocale } from "@/i18n/route-locale";

const PATH = "/sign-up/verify-email";

/** 認証状態に依存するため、ビルド時のプリレンダリングを無効化 */
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/sign-up/verify-email">): Promise<Metadata> {
  const locale = await prepareRouteLocale(params, "/sign-up/verify-email");
  return createAuthPageMetadata("verifyEmail", "pageTitle", PATH, locale);
}

export default async function VerifyEmailPage({
  params,
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
} & Pick<PageProps<"/[locale]/sign-up/verify-email">, "params">) {
  const locale = await prepareRouteLocale(params, "/sign-up/verify-email");
  // 確認済み（＝ログイン済み）ユーザーにこのページは不要。
  // 再送しても GoTrue は送信せず「再送した」と誤解させるため、マイページへ退避する。
  await redirectIfAuthenticated(localizedHref("/mypage", locale));

  const { email } = await searchParams;
  const t = await getTranslations("verifyEmail");
  const tAuth = await getTranslations("auth");
  const signUp = resolveNavTargetFor("/sign-up", locale);

  return (
    <ContentContainer>
      <PageTitle>{t("pageTitle")}</PageTitle>
      <section className="space-y-6">
        <SectionTitle>{t("sectionTitle")}</SectionTitle>

        <div className="space-y-3 text-surface-700">
          {email ? (
            <>
              <p>{t("sentTo")}</p>
              {/* 打ち間違いに本人が気付けるよう、送信先をそのまま見せる */}
              <p className="break-all text-center font-bold">{email}</p>
            </>
          ) : (
            <p>{t("sent")}</p>
          )}
          <p className="leading-relaxed">
            {t("checkInbox", { subject: t("mailSubject") })}
          </p>
        </div>

        <HighlightPanel>
          <h3 className="font-bold">{t("troubleTitle")}</h3>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-surface-700">
            <li>{t("troubleDelay")}</li>
            <li>{t("troubleSpam")}</li>
            <li>
              {t.rich("troubleTypo", {
                signUp: (chunks) => (
                  <Link href={signUp.href} className={TEXT_LINK_CLASSES}>
                    {chunks}
                  </Link>
                ),
              })}
            </li>
            <li>{t("troubleResend")}</li>
          </ul>
        </HighlightPanel>

        <ResendEmailButton email={email ?? ""} />

        <div className="mx-auto flex max-w-sm items-center gap-4">
          <div className="flex-1 border-t border-panel" />
          <span className="text-sm text-surface-500">{tAuth("or")}</span>
          <div className="flex-1 border-t border-panel" />
        </div>

        <div className="space-y-3">
          <p className="text-center text-sm text-surface-500">
            {t("googleAlternative")}
          </p>
          <GoogleOAuthButton intent="signUp" />
        </div>
      </section>
    </ContentContainer>
  );
}
