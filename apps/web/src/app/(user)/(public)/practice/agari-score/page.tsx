/**
 * 和了形の点数計算 設定
 *
 * @description
 * 和了形の点数計算の設定ページ。エンドレス自由練習形式の練習で、
 * 練習開始前に各種オプションを設定する。
 *
 * @flow
 * 1. ユーザーが練習一覧から和了形の点数計算を選択して遷移
 * 2. 役回答要否・満貫簡略化・符入力要否・自動次へ・親子選択・点数範囲を設定
 * 3. 「開始」を押すと設定をクエリパラメータに変換し play ページへ遷移
 */
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { createNamespaceMetadata } from "@/app/_lib/metadata";
import { ContentContainer } from "@/app/(user)/_components/content-container";
import { PageTitle } from "@/app/(user)/_components/page-title";
import { LinkRowList } from "@/app/(user)/_components/link-row";
import { NativeAdRow } from "@/app/(user)/_components/native-ad-row";
import { SectionTitle } from "@/app/(user)/_components/section-title";
import { getNativeAdCreative } from "@/lib/ads/creatives";
import { chaptersInSection } from "@mahjong-scoring/features/curriculum/registry";
import { PracticeChapterSection } from "../_components/practice-chapter-section";
import { ScoreSetupForm } from "./_components/score-setup-form";
import { AgariScoreHelpTour } from "./_components/agari-score-help-tour";

export async function generateMetadata(): Promise<Metadata> {
  // slug "agari-score" は練習レジストリ（PRACTICE_MENU_SLUGS）に載らないため
  // createPracticeMetadata を使えない。パスをここで明示する。
  return createNamespaceMetadata("agariScore", {
    path: "/practice/agari-score",
  });
}

export default async function ScoreSetupPage() {
  const t = await getTranslations("agariScore");
  const tp = await getTranslations("practice");
  const ad = await getNativeAdCreative("practice-intro-native-ad");

  return (
    <ContentContainer
      breadcrumb={[
        { label: tp("modes.practical"), href: "/practice?mode=practical" },
        { label: t("title") },
      ]}
    >
      <PageTitle action={<AgariScoreHelpTour />}>{t("title")}</PageTitle>

      <div className="space-y-8">
        {/* SectionTitle と各カードの間隔を space-y で統一（mt- の散在を避ける） */}
        <div className="space-y-4 sm:space-y-6 md:space-y-8">
          <SectionTitle>{tp("settingsTitle")}</SectionTitle>
          <ScoreSetupForm />
        </div>

        {/* 点数の計算セクションの章はどれも本文の CTA でこの自由練習へ送る。
            戻る先をその 4 章にそろえる（章を足しても写し忘れない） */}
        <PracticeChapterSection
          title={tp("requiredKnowledge")}
          slugs={chaptersInSection("score")}
        />

        {ad && (
          <LinkRowList inset>
            <NativeAdRow creative={ad} />
          </LinkRowList>
        )}
      </div>
    </ContentContainer>
  );
}
