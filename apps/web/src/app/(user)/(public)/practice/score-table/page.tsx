/**
 * 点数表早引き練習 説明・設定
 *
 * @description
 * 点数表早引き練習の説明＋出題設定ページ。問題方式のデモに加え、
 * 親子・ツモロン・点数帯（満貫未満/満貫以上）を選んでチャレンジ／トレーニングを
 * 開始できる。ガイド（/learn/mangan-*）から条件付きで遷移した場合は、その条件が
 * 初期選択になる。
 *
 * @flow
 * 1. 練習一覧、または学習ガイドの練習リンクから遷移
 * 2. 問題方式のデモと出題設定（3カード）が表示される
 * 3. 設定を選び「開始」または「トレーニング」で play / training へ遷移
 */
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ContentContainer } from "@/app/_components/content-container";
import { PageTitle } from "@/app/_components/page-title";
import { SectionTitle } from "@/app/_components/section-title";
import { createMetadata } from "@/app/_lib/metadata";
import { ScoreTableHowToPlay } from "./_components/score-table-how-to-play";
import { ScoreTableSetup } from "./_components/score-table-setup";
import { hasSelectionParams, searchParamsToSelection } from "./_lib/options";

type SearchParams = Record<string, string | string[] | undefined>;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("scoreTableChallenge");
  return createMetadata({ title: t("title"), description: t("description") });
}

export default async function ScoreTablePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const [t, tp] = await Promise.all([
    getTranslations("scoreTableChallenge"),
    getTranslations("practice"),
  ]);

  const selection = searchParamsToSelection(params);
  const applyInitial = hasSelectionParams(params);

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
            <ScoreTableHowToPlay selection={selection} />
          </div>
        </div>

        <div className="space-y-4">
          <SectionTitle>{t("setup.title")}</SectionTitle>
          <ScoreTableSetup
            initialSelection={selection}
            applyInitial={applyInitial}
          />
        </div>
      </div>
    </ContentContainer>
  );
}
