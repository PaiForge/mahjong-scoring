/**
 * 点数表早引き練習 説明・設定
 *
 * @description
 * 点数表早引き練習の説明＋出題設定ページ。問題方式のデモに加え、
 * 親子・ツモロン・点数帯（満貫未満/満貫以上）を選んでチャレンジ／トレーニングを
 * 開始できる。ガイド（/learn/mangan-*）から条件付きで遷移した場合は、その条件が
 * 初期選択になる。条件はクライアント側で `useSearchParams()` から読む
 * （サーバーで `searchParams` を読むとルートが動的になり、初回表示が
 * `loading.tsx` のスケルトンを経由してしまうため）。
 *
 * @flow
 * 1. 練習一覧、または学習ガイドの練習リンクから遷移
 * 2. 問題方式のデモと出題設定（3カード）が表示される
 * 3. 設定を選び「開始」または「トレーニング」で play / training へ遷移
 */
import type { Metadata } from "next";
import { HowToPlaySection } from "../_components/how-to-play-section";
import { getTranslations } from "next-intl/server";
import { ContentContainer } from "@/app/(user)/_components/content-container";
import { PageTitle } from "@/app/(user)/_components/page-title";
import { SectionTitle } from "@/app/(user)/_components/section-title";
import { createPracticeMetadata } from "../_lib/metadata";
import { PRACTICE_SETUP_ANCHOR_ID } from "../_lib/scroll-anchor";
import { ScoreTableHowToPlay } from "./_components/score-table-how-to-play";
import { ScoreTableSetup } from "./_components/score-table-setup";

export async function generateMetadata(): Promise<Metadata> {
  return createPracticeMetadata("score-table");
}

export default async function ScoreTablePage() {
  const [t, tp] = await Promise.all([
    getTranslations("scoreTableChallenge"),
    getTranslations("practice"),
  ]);

  return (
    <ContentContainer
      breadcrumb={[
        { label: tp("title"), href: "/practice" },
        { label: t("title") },
      ]}
    >
      <PageTitle>{t("title")}</PageTitle>

      <div className="space-y-8">
        <HowToPlaySection
          title={t("howToPlay.title")}
          lead={t("howToPlay.lead")}
        >
          <ScoreTableHowToPlay />
        </HowToPlaySection>

        {/* 結果ページの「設定を変更する」がこの見出しへ直接送る（scroll-mt はヘッダ分の逃がし） */}
        <div id={PRACTICE_SETUP_ANCHOR_ID} className="scroll-mt-20 space-y-4">
          <SectionTitle>{t("setup.title")}</SectionTitle>
          <ScoreTableSetup />
        </div>
      </div>
    </ContentContainer>
  );
}
