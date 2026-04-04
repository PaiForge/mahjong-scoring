/**
 * 点数表早引き
 *
 * @description
 * 点数表早引きドリルの説明ページ。
 * 親子・ツモロン・翻数・符から正しい点数を答えるチャレンジモード対応ドリル。
 * 教本ページは持たないが、点数早見表ページへのリンクを提供する。
 *
 * @flow
 * 1. ドリルの説明を読む
 * 2. 点数表を見る（参考リンク）
 * 3. 「スタート」ボタンで play ページへ遷移
 */
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { createMetadata } from "@/app/_lib/metadata";
import { ContentContainer } from "@/app/_components/content-container";
import { PageTitle } from "@/app/_components/page-title";
import { BookIcon } from "@/app/_components/icons/book-icon";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("scoreTableDrill");
  return createMetadata({ title: t("title"), description: t("description") });
}

export default async function ScoreTablePage() {
  const t = await getTranslations("scoreTableDrill");
  const tc = await getTranslations("challenge");

  return (
    <ContentContainer>
      <PageTitle>{t("title")}</PageTitle>
      <p className="mt-2 text-sm text-surface-500">{t("description")}</p>

      <div className="mt-6 flex items-center gap-2 text-sm">
        <BookIcon className="size-4 text-primary-600" />
        <Link
          href="/reference"
          className="text-primary-600 hover:text-primary-700 font-medium transition-colors"
        >
          {t("learnLink")}
        </Link>
      </div>

      <div className="mt-8 text-center">
        <Link
          href="/practice/score-table/play"
          className="inline-block rounded-lg bg-primary-500 px-8 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-600"
        >
          {tc("startButton")}
        </Link>
      </div>
    </ContentContainer>
  );
}
