/**
 * 待ち別点数計算 設定
 *
 * @description
 * 待ち別点数計算の設定ページ。エンドレス自由練習形式で、聴牌形から待ち牌を
 * 読み、待ちごとにツモ・ロンの点数を答える練習。設定項目は点数計算総合演習と
 * 同じで、保存先だけを分けている。出題範囲の但し書き（面子手のみ・2 面待ち
 * 以上・役なしの扱い）を開始ボタンの上に出す。
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
import { HighlightPanel } from "@/app/(user)/_components/highlight-panel";
import { PageTitle } from "@/app/(user)/_components/page-title";
import { SectionTitle } from "@/app/(user)/_components/section-title";
import { MachiScoreHelpTour } from "./_components/machi-score-help-tour";
import { MachiScoreSetupForm } from "./_components/machi-score-setup-form";

export async function generateMetadata(): Promise<Metadata> {
  // slug "machi-score" は練習レジストリ（PRACTICE_MENU_SLUGS）に載らないため
  // createPracticeMetadata を使えない。パスをここで明示する（リテラルで書くのは
  // seo-coverage.test.ts がソースの文字列で canonical を検査するため）。
  return createNamespaceMetadata("machiScore", {
    path: "/practice/machi-score",
  });
}

export default async function MachiScoreSetupPage() {
  const t = await getTranslations("machiScore");
  const tp = await getTranslations("practice");

  return (
    <ContentContainer
      breadcrumb={[
        { label: tp("title"), href: "/practice" },
        { label: t("title") },
      ]}
    >
      <PageTitle action={<MachiScoreHelpTour />}>{t("title")}</PageTitle>

      <div className="space-y-4 sm:space-y-6 md:space-y-8">
        <SectionTitle>{tp("settingsTitle")}</SectionTitle>
        <MachiScoreSetupForm>
          <HighlightPanel>
            <p className="text-sm font-bold text-surface-800">
              {t("notes.title")}
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-surface-700">
              <li>{t("notes.mentsuOnly")}</li>
              <li>{t("notes.multiWait")}</li>
            </ul>
          </HighlightPanel>
        </MachiScoreSetupForm>
      </div>
    </ContentContainer>
  );
}
