import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ContentContainer } from "@/app/[locale]/(user)/_components/content-container";
import { PageTitle } from "@/app/[locale]/(user)/_components/page-title";
import { createNamespaceMetadata } from "@/app/_lib/metadata";
import { RelatedReferencesSection } from "../_components/related-references-section";
import { ScoreTableFromQuery } from "./_components/score-table-from-query";
import { REFERENCE_PATH } from "@mahjong-scoring/features/routes";
import { prepareRouteLocale } from "@/i18n/route-locale";

/**
 * 点数早見表
 *
 * @description
 * 符×翻（20〜110 符 × 1〜4 翻）と満貫以上の点数を、親子・ロンツモで切り替えて
 * 引く表。練習の答え合わせからは `?role=&winType=&han=&fu=` 付きで開かれ、
 * その和了のセルがハイライトされる。
 *
 * @design 表の数字を初期 HTML に載せる
 * このページはサイトで最も検索需要が高い（「麻雀 点数表」）。静的生成のまま、
 * 既定の表（子・ロン・符×翻）をサーバーで描いて HTML に数字を含める。
 * クエリの読み取り（`useSearchParams`）は何も描画しない葉に閉じ込め、hydration 後に
 * タブとハイライトを合わせる（`ScoreTableFromQuery`）。ルール設定（切り上げ満貫）は
 * 端末ローカルなので、サーバーと hydration 中は既定値で描き、その後に追随させる。
 *
 * @design 英語でも公開する（英語の最初のページ）
 * 日本語（`/reference/score-table`）と英語（`/en/reference/score-table`）を言語ごとに
 * 静的生成する。ページと `generateMetadata` はどちらも、翻訳を引く前に
 * `prepareRouteLocale` で言語を検証・確定させる（metadata とページは独立に評価され、
 * 確定前に翻訳を引くと next-intl が headers を読みに行き動的になる）。metadata の
 * ヘルパーには確定した言語を明示で渡す（タイトル・説明・canonical・hreflang を
 * その言語で組むため）。英語で読む名前空間は `EN_ROUTE_NAMESPACES` に列挙し、
 * 完訳であることを `publication-gate.test.ts` が検査する。
 *
 * @flow タブバー・早見表の一覧・練習の答え合わせから開く。表の下の
 * 「ほかの早見表」から役一覧・用語集へ（`relatedReferences`）
 */
export async function generateMetadata({
  params,
}: PageProps<"/[locale]/reference/score-table">): Promise<Metadata> {
  const locale = await prepareRouteLocale(params, "/reference/score-table");
  return createNamespaceMetadata("scoreTable", {
    title: "pageTitle",
    description: "pageDescription",
    path: "/reference/score-table",
    locale,
  });
}

export default async function ReferenceScoreTablePage({
  params,
}: PageProps<"/[locale]/reference/score-table">) {
  await prepareRouteLocale(params, "/reference/score-table");
  const t = await getTranslations("scoreTable");
  const tHub = await getTranslations("reference");

  return (
    <ContentContainer
      breadcrumb={[
        { label: tHub("title"), href: REFERENCE_PATH },
        { label: t("pageTitle") },
      ]}
    >
      <PageTitle>{t("pageTitle")}</PageTitle>

      <div className="space-y-10">
        <ScoreTableFromQuery />

        {/* タブバーからここへ直接来た人に、ほかの早見表があることを見せる */}
        <RelatedReferencesSection current="scoreTable" />
      </div>
    </ContentContainer>
  );
}
