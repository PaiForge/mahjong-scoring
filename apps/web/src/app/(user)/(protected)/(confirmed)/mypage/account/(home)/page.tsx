/**
 * アカウント
 *
 * @description ログインの単位としてのアカウントを扱うページ。いまはメールアドレスと
 *   ログイン方法の確認、そして退会への入口だけを持つ。メールアドレスやパスワードの
 *   変更を足すときもここに置く。
 *
 *   退会の導線はこのページの最下部にだけ置く。以前はプロフィール編集の最下部に
 *   あったが、プロフィール編集は本登録の直後に誘導される画面で、登録したばかりの
 *   人に「削除」の文言を見せることになっていた。「他人に見せる自分」を整える
 *   プロフィールと、契約・ログインの単位であるアカウントは別の概念なので、
 *   退会はアカウント側に属する。
 *
 *   退会は普段の画面から見えないほうがよい一方で、探せば見つかる場所にも
 *   あるべきなので（「退会できない」という不信感を避ける）、多くのサービスと
 *   同じ「アカウント → 一番下」に揃える。プライバシーポリシーからの直リンクも残す。
 * @flow マイページ → アカウント → （最下部の）アカウントを削除 → 退会
 */
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { ContentContainer } from "@/app/(user)/_components/content-container";
import { PageTitle } from "@/app/(user)/_components/page-title";
import { SectionTitle } from "@/app/(user)/_components/section-title";
import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import { createPrivateMetadata } from "@/app/_lib/metadata";
import { requireConfirmedUser } from "@/lib/auth";

export async function generateMetadata(): Promise<Metadata> {
  return createPrivateMetadata("mypageAccount");
}

export default async function MypageAccountPage() {
  const [{ user }, t, tMypage] = await Promise.all([
    requireConfirmedUser(),
    getTranslations("mypageAccount"),
    getTranslations("mypage"),
  ]);

  const { provider } = user;
  const providerLabel =
    provider === "email" || provider === "google"
      ? t(`login.providers.${provider}`)
      : (provider ?? t("login.unknown"));

  return (
    <ContentContainer
      breadcrumb={[
        { label: tMypage("pageTitle"), href: "/mypage" },
        { label: t("pageTitle") },
      ]}
    >
      <PageTitle>{t("pageTitle")}</PageTitle>

      <section className="space-y-4">
        <SectionTitle>{t("login.title")}</SectionTitle>
        <dl className="space-y-4 rounded-panel border border-panel bg-white p-5">
          <div>
            <dt className="text-xs font-bold text-surface-500">
              {t("login.email")}
            </dt>
            <dd className="mt-0.5 break-all text-sm font-medium text-foreground">
              {user.email ?? t("login.unknown")}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-bold text-surface-500">
              {t("login.provider")}
            </dt>
            <dd className="mt-0.5 text-sm font-medium text-foreground">
              {providerLabel}
            </dd>
          </div>
        </dl>
      </section>

      {/* 退会への入口。本文から区切り線で切り離して最下部に置き、
          ログイン情報を見に来ただけの人の視線には入りにくくする。 */}
      <div className="mt-10 border-t border-panel pt-6 text-center">
        <Link
          href="/mypage/account/delete"
          className={`text-sm ${TEXT_LINK_CLASSES}`}
        >
          {t("deleteAccountLink")}
        </Link>
      </div>
    </ContentContainer>
  );
}
