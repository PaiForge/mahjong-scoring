/**
 * 聴牌形の点数計算 設定
 *
 * @description
 * 聴牌形の点数計算の設定ページ。エンドレス自由練習形式で、聴牌形から待ち牌を
 * 読み、待ちごとにツモ・ロンの点数を答える練習。設定項目は和了形の点数計算と
 * 同じで、保存先だけを分けている。出題範囲の但し書き（面子手のみ・2 面待ち
 * 以上）は脚注として開始ボタンの下に出す。
 *
 * @flow
 * 1. ユーザーが練習一覧のバナーから遷移
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
import { TenpaiScoreHelpTour } from "./_components/tenpai-score-help-tour";
import { TenpaiScoreSetupForm } from "./_components/tenpai-score-setup-form";

export async function generateMetadata(): Promise<Metadata> {
  // slug "tenpai-score" は練習レジストリ（PRACTICE_MENU_SLUGS）に載らないため
  // createPracticeMetadata を使えない。パスをここで明示する（リテラルで書くのは
  // seo-coverage.test.ts がソースの文字列で canonical を検査するため）。
  return createNamespaceMetadata("tenpaiScore", {
    path: "/practice/tenpai-score",
  });
}

export default async function TenpaiScoreSetupPage() {
  const t = await getTranslations("tenpaiScore");
  const tp = await getTranslations("practice");
  const ad = await getNativeAdCreative("practice-intro-native-ad");

  return (
    <ContentContainer
      breadcrumb={[
        { label: tp("modes.practical"), href: "/practice?mode=practical" },
        { label: t("title") },
      ]}
    >
      <PageTitle action={<TenpaiScoreHelpTour />}>{t("title")}</PageTitle>

      <div className="space-y-8">
        <div className="space-y-4 sm:space-y-6 md:space-y-8">
          <SectionTitle>{tp("settingsTitle")}</SectionTitle>
          <TenpaiScoreSetupForm>
            {/* 出題範囲は始める前に読ませたい告知ではなく、始めたあとで
              「なぜこの形しか出ないのか」を引くための脚注。見出しも箇条書きの
              点も立てず、※ の但し書きとして開始ボタンの下に小さく置く */}
            <div className="space-y-0.5 text-xs leading-relaxed text-surface-500">
              <p>{t("notes.mentsuOnly")}</p>
              <p>{t("notes.multiWait")}</p>
            </div>
          </TenpaiScoreSetupForm>
        </div>

        {/* 関連するレッスンの節を持たないので、設定の後ろに直接置く */}
        {ad && (
          <LinkRowList inset>
            <NativeAdRow creative={ad} />
          </LinkRowList>
        )}
      </div>
    </ContentContainer>
  );
}
