import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

import { PageTitle } from "@/app/[locale]/(user)/_components/page-title";
import { ContentContainer } from "@/app/[locale]/(user)/_components/content-container";
import { createPrivateMetadata } from "@/app/_lib/metadata";
import { localizedHref } from "@/i18n/public-path";
import { getAuthenticatedUser } from "../../../../../lib/auth";
import { getLatestBanReason, isUserBanned } from "../../../../../lib/ban";
import { prepareRouteLocale } from "@/i18n/route-locale";

const PATH = "/banned";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/banned">): Promise<Metadata> {
  const locale = await prepareRouteLocale(params, PATH);
  return createPrivateMetadata("banned", "title", { locale });
}

/**
 * BAN ページ
 *
 * @description BAN されたユーザーに表示されるページ。BAN 理由を表示する。
 * 本人だけが見る通知なので、どの言語でも検索エンジンに載せない（`createPrivateMetadata`）。
 * @flow 認証チェック → BAN チェック → 最新の BAN 理由を取得して表示。
 * 未認証はページの言語のログインへ、BAN されていなければページの言語のトップへ
 */
export default async function BannedPage({
  params,
}: PageProps<"/[locale]/banned">) {
  const locale = await prepareRouteLocale(params, PATH);
  const t = await getTranslations("banned");

  // 未認証なら getAuthenticatedUser が今の言語の /sign-in へリダイレクトする
  // （戻り先は付けない。従来どおり、ログイン後はマイページへ）
  const user = await getAuthenticatedUser();

  // BAN されていなければホームへ
  const banned = await isUserBanned(user.id);
  if (!banned) {
    redirect(localizedHref("/", locale));
  }

  const reason = await getLatestBanReason(user.id);

  return (
    <ContentContainer>
      <div className="space-y-4 py-12 text-center">
        <PageTitle>{t("title")}</PageTitle>
        <p className="text-gray-600">{t("message")}</p>
        {reason && (
          <p className="rounded-lg bg-destructive-subtle px-4 py-3 text-sm text-destructive-strong">
            {t("reason", { reason })}
          </p>
        )}
        <p className="text-sm text-gray-500">{t("contact")}</p>
      </div>
    </ContentContainer>
  );
}
