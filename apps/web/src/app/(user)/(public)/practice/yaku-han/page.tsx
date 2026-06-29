/**
 * 役の翻数 説明
 *
 * @description
 * 役翻数練習の説明ページ。役名と門前/鳴きの状態から翻数を答える練習の
 * 概要（問題方式デモ）を表示し、出題範囲の選択と練習開始ボタンを提供する。
 * 出題範囲（食い下がりなし / 食い下がりあり / すべて）はクライアント側の
 * `YakuHanStartPanel` で選択し、play / training への `range` クエリに反映する。
 *
 * @flow
 * 1. ユーザーが練習一覧から役の翻数を選択して遷移
 * 2. 問題方式デモと出題範囲セレクタ、「開始」「トレーニング」ボタンが表示される
 * 3. 範囲を選んで「開始」を押すと play ページへ遷移（range クエリ付き）
 */
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ContentContainer } from "@/app/_components/content-container";
import { PageTitle } from "@/app/_components/page-title";
import { SectionTitle } from "@/app/_components/section-title";
import { createMetadata } from "@/app/_lib/metadata";
import { YakuHanHowToPlay } from "./_components/yaku-han-how-to-play";
import { YakuHanStartPanel } from "./_components/yaku-han-start-panel";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("yakuHanChallenge");
  return createMetadata({ title: t("title"), description: t("description") });
}

export default async function YakuHanPage() {
  const t = await getTranslations("yakuHanChallenge");
  const tp = await getTranslations("practice");

  return (
    <ContentContainer
      breadcrumb={[
        { label: tp("title"), href: "/practice" },
        { label: t("title") },
      ]}
    >
      <PageTitle>{t("title")}</PageTitle>
      <div className="space-y-8">
        <div className="space-y-4">
          <SectionTitle>{t("howToPlay.title")}</SectionTitle>
          <p className="text-sm text-surface-600">{t("howToPlay.lead")}</p>
          <div className="rounded-xl border border-surface-200 bg-surface-50 p-6">
            <YakuHanHowToPlay />
          </div>
        </div>

        <YakuHanStartPanel />
      </div>
    </ContentContainer>
  );
}
