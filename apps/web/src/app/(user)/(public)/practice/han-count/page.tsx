/**
 * 翻数即答 説明
 *
 * @description
 * 翻数即答ドリルの説明ページ。ドリルの概要を表示し、
 * 練習開始ボタンを提供する。
 *
 * @flow
 * 1. ユーザーが練習一覧から翻数即答を選択して遷移
 * 2. ドリルの説明と「開始」ボタンが表示される
 * 3. 「開始」を押すと play ページへ遷移
 */
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { createMetadata } from "@/app/_lib/metadata";
import { ContentContainer } from "@/app/_components/content-container";
import { PageTitle } from "@/app/_components/page-title";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("hanCountDrill");
  return createMetadata({ title: t("title"), description: t("description") });
}

export default async function HanCountPage() {
  const t = await getTranslations("hanCountDrill");
  const tc = await getTranslations("challenge");

  return (
    <ContentContainer>
      <PageTitle>{t("title")}</PageTitle>
      <p className="mt-2 text-sm text-surface-500">{t("introDescription")}</p>

      <div className="mt-8 text-center">
        <Link
          href="/practice/han-count/play"
          className="inline-block rounded-lg bg-primary-500 px-8 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-600"
        >
          {tc("startButton")}
        </Link>
      </div>
    </ContentContainer>
  );
}
