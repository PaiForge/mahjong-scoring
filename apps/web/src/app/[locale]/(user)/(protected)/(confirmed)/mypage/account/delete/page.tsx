/**
 * 退会
 *
 * @description アカウント退会の確認ページ。退会の影響を説明し、確認のうえアカウントを削除する。
 * @flow マイページ → アカウント → アカウントを削除 → 確認モーダル → 削除 → トップへ（ログアウト）
 */
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { SectionTitle } from "@/app/[locale]/(user)/_components/section-title";
import { createPrivateMetadata } from "@/app/_lib/metadata";
import { requireConfirmedUser } from "@/lib/auth";

import { DeleteAccountButton } from "./_components/delete-account-button";
import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import { MypageSubpageLayout } from "../../_components/mypage-subpage-layout";
import { prepareRouteLocale } from "@/i18n/route-locale";
import { resolveNavTargetFor } from "@/app/[locale]/(user)/_components/_lib/locale-nav-target";
import { ACCOUNT_PAGE_PATH } from "@/lib/users/account-page-notice";

import { confirmedGuardOptions } from "../../../_lib/guard-options";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/mypage/account/delete">): Promise<Metadata> {
  const locale = await prepareRouteLocale(params, "/mypage/account/delete");
  return createPrivateMetadata("deleteAccount", "pageTitle", { locale });
}

export default async function DeleteAccountPage({
  params,
}: PageProps<"/[locale]/mypage/account/delete">) {
  const locale = await prepareRouteLocale(params, "/mypage/account/delete");
  await requireConfirmedUser(
    confirmedGuardOptions("/mypage/account/delete", locale),
  );
  const t = await getTranslations("deleteAccount");
  const tAccount = await getTranslations("mypageAccount");

  return (
    <MypageSubpageLayout
      title={t("pageTitle")}
      parents={[{ label: tAccount("pageTitle"), href: ACCOUNT_PAGE_PATH }]}
    >
      <section className="space-y-4">
        <SectionTitle>{t("sectionTitle")}</SectionTitle>

        <div className="space-y-3">
          <p className="text-sm leading-relaxed text-surface-600">
            {t("warning")}
          </p>
          <ul className="list-disc space-y-1.5 pl-5 text-sm text-surface-600">
            <li>{t("consequences.personalData")}</li>
            <li>{t("consequences.scoresRemoved")}</li>
            <li>{t("consequences.usernameLocked")}</li>
          </ul>
        </div>
      </section>

      <div className="mt-8">
        <DeleteAccountButton />
      </div>

      {/* 破壊的操作の直下に戻るリンクを並べると誤クリックしやすいため、
          アカウントページの退会リンクと同じ区切り線で離す。 */}
      <div className="mt-10 border-t border-panel pt-6 text-center">
        <Link
          href={resolveNavTargetFor(ACCOUNT_PAGE_PATH, locale).href}
          className={`text-sm font-medium ${TEXT_LINK_CLASSES}`}
        >
          {t("backToAccount")}
        </Link>
      </div>
    </MypageSubpageLayout>
  );
}
