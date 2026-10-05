import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ContentContainer } from "@/app/(user)/_components/content-container";
import { PageTitle } from "@/app/(user)/_components/page-title";
import { createNamespaceMetadata } from "@/app/_lib/metadata";
import { ScoreTableFromQuery } from "./_components/score-table-from-query";

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
 */
export async function generateMetadata(): Promise<Metadata> {
  return createNamespaceMetadata("scoreTable", {
    title: "pageTitle",
    description: "pageDescription",
    path: "/reference/score-table",
  });
}

export default async function ReferenceScoreTablePage() {
  const t = await getTranslations("scoreTable");
  const tHub = await getTranslations("reference");

  return (
    <ContentContainer
      breadcrumb={[
        { label: tHub("title"), href: "/reference" },
        { label: t("pageTitle") },
      ]}
    >
      <PageTitle>{t("pageTitle")}</PageTitle>

      <ScoreTableFromQuery />
    </ContentContainer>
  );
}
