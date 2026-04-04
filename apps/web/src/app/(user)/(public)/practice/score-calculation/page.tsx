/**
 * 点数計算ドリル
 *
 * @description
 * 点数計算ドリルの説明ページ。
 * 手牌・和了牌・風牌・ツモロン・ドラなどの情報から正しい点数を答えるチャレンジモード対応ドリル。
 * 点数計算総合演習と同様の問題を表示し、点数のみを回答する。
 *
 * @flow
 * 1. ドリルの説明を読む
 * 2. 「スタート」ボタンで play ページへ遷移
 */
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { createMetadata } from "@/app/_lib/metadata";
import { ContentContainer } from "@/app/_components/content-container";
import { PageTitle } from "@/app/_components/page-title";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("scoreCalculationDrill");
  return createMetadata({ title: t("title"), description: t("description") });
}

export default async function ScoreCalculationPage() {
  const t = await getTranslations("scoreCalculationDrill");
  const tc = await getTranslations("challenge");

  return (
    <ContentContainer>
      <PageTitle>{t("title")}</PageTitle>
      <p className="mt-2 text-sm text-surface-500">{t("description")}</p>

      <div className="mt-8 text-center">
        <Link
          href="/practice/score-calculation/play"
          className="inline-block rounded-lg bg-primary-500 px-8 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-600"
        >
          {tc("startButton")}
        </Link>
      </div>
    </ContentContainer>
  );
}
