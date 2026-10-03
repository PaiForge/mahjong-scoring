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
 */
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { ContentContainer } from "@/app/(user)/_components/content-container";
import { HighlightPanel } from "@/app/(user)/_components/highlight-panel";
import { PageTitle } from "@/app/(user)/_components/page-title";
import { SectionTitle } from "@/app/(user)/_components/section-title";
import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import { createTitleOnlyMetadata } from "@/app/_lib/metadata";
import { redirectIfAuthenticated } from "@/lib/auth";

import { GoogleOAuthButton } from "../../sign-in/_components/google-oauth-button";
import { ResendEmailButton } from "./_components/resend-email-button";

/** 認証状態に依存するため、ビルド時のプリレンダリングを無効化 */
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return createTitleOnlyMetadata("verifyEmail", "pageTitle");
}

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  // 確認済み（＝ログイン済み）ユーザーにこのページは不要。
  // 再送しても GoTrue は送信せず「再送した」と誤解させるため、マイページへ退避する。
  await redirectIfAuthenticated();

  const { email } = await searchParams;
  const t = await getTranslations("verifyEmail");
  const tAuth = await getTranslations("auth");

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
                  <Link href="/sign-up" className={TEXT_LINK_CLASSES}>
                    {chunks}
                  </Link>
                ),
              })}
            </li>
            <li>{t("troubleResend")}</li>
          </ul>
        </HighlightPanel>

        <div className="text-center">
          <ResendEmailButton email={email ?? ""} />
        </div>

        <div className="mx-auto flex max-w-sm items-center gap-4">
          <div className="flex-1 border-t-2 border-dashed border-border/40" />
          <span className="text-sm text-surface-500">{tAuth("or")}</span>
          <div className="flex-1 border-t-2 border-dashed border-border/40" />
        </div>

        <div className="space-y-3">
          <p className="text-center text-sm text-surface-500">
            {t("googleAlternative")}
          </p>
          <GoogleOAuthButton />
        </div>
      </section>
    </ContentContainer>
  );
}
