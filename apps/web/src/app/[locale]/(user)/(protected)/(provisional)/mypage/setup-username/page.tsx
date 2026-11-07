import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { createPrivateMetadata } from "@/app/_lib/metadata";
import { ContentContainer } from "@/app/[locale]/(user)/_components/content-container";
import { PageTitle } from "@/app/[locale]/(user)/_components/page-title";
import { SectionTitle } from "@/app/[locale]/(user)/_components/section-title";
import { requireProvisionalUser } from "@/lib/auth";

import { UsernameForm } from "./_components/username-form";
import { setupUsernameGuardOptions } from "./_lib/guard-options";
import { prepareRouteLocale } from "@/i18n/route-locale";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/mypage/setup-username">): Promise<Metadata> {
  const locale = await prepareRouteLocale(params, "/mypage/setup-username");
  return createPrivateMetadata("setupUsername", "title", { locale });
}

/**
 * ユーザー名の設定（登録の途中）
 *
 * @description 確認メールのリンクや Google から着いた、プロフィールの無い人が
 * ユーザー名と表示名を決めて登録を終えるページ。英語のページ（`/en/...`）へは
 * `/auth/callback` が `locale` を見て送る。ガードの飛ばし先（ログイン・BAN・
 * マイページ）もページの言語。英語では未ログインのときログイン後にこのページへ
 * 戻す（日本語は従来どおり戻り先を付けない。`setupUsernameGuardOptions`）。
 * @flow ガード → フォーム → 登録完了でページの言語のトップ（ログイン済みは
 * ダッシュボード）へ
 */
export default async function SetupUsernamePage({
  params,
}: PageProps<"/[locale]/mypage/setup-username">) {
  const locale = await prepareRouteLocale(params, "/mypage/setup-username");
  await requireProvisionalUser(setupUsernameGuardOptions(locale));
  const t = await getTranslations("setupUsername");

  return (
    <ContentContainer>
      <PageTitle>{t("title")}</PageTitle>
      <section className="space-y-4">
        <SectionTitle>{t("sectionTitle")}</SectionTitle>
        {/* 確認メールのリンクや Google から着いた人は登録済みのつもりでいるため、
            まだ途中であることと、この画面で何を決めるかを先に伝える */}
        <p className="text-sm leading-relaxed text-surface-500">{t("lead")}</p>
        <UsernameForm />
      </section>
    </ContentContainer>
  );
}
