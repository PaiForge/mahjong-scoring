/**
 * 点数計算総合演習 設定
 *
 * @description
 * 点数計算総合演習の設定ページ。エンドレス自由練習形式のドリルで、
 * 練習開始前に各種オプションを設定する。
 *
 * @flow
 * 1. ユーザーが練習一覧から点数計算総合演習を選択して遷移
 * 2. 役回答要否・満貫簡略化・符入力要否・自動次へ・親子選択・点数範囲を設定
 * 3. 「開始」を押すと設定をクエリパラメータに変換し play ページへ遷移
 */
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { createMetadata } from "@/app/_lib/metadata";
import { ContentContainer } from "@/app/_components/content-container";
import { PageTitle } from "@/app/_components/page-title";
import { SetupScreen } from "./_components/setup-screen";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("score");
  return createMetadata({ title: t("title"), description: t("description") });
}

export default async function ScoreSetupPage() {
  const t = await getTranslations("score");

  return (
    <ContentContainer>
      <PageTitle>{t("title")}</PageTitle>
      <p className="mt-3 text-sm text-surface-500">{t("description")}</p>
      <SetupScreen />
    </ContentContainer>
  );
}
