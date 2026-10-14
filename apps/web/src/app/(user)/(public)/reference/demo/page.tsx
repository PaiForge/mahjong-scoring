/**
 * 早見表の連動サンプル
 *
 * @description LP の「早見表」の紹介から開くページ。練習の答え合わせで正解の
 * 点数や役名を押すと、その場で点数表・役一覧がモーダルで開くことを、本番と
 * 同じ部品で答え終えた 1 問を置いて試させる。解く手順は省く（解く体験は
 * /try/agari-score が担う）。見え方は練習の答え合わせに揃え、説明文は置かない — 開いた
 * 直後に盤面へスクロールし、ヘルプツアーが自動で始まって押す場所を示す。
 * 盤面の下に、開いてきた LP へ戻るリンクと、答え合わせから同じく早見表を
 * 開ける練習の入口（体験ページと共有の `TryPracticeLinks`）を置く。
 * cookie を読まない静的ページ。
 *
 * @flow ヘルプツアーで役と点数が照らされる → 役名を押す → 役一覧がその役に着地して開く / 点数を押す → 正解の
 * セルをハイライトした点数表が開く → 練習のカードから説明ページへ / LP へ戻る
 */
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { ContentContainer } from "@/app/(user)/_components/content-container";
import { PageTitle } from "@/app/(user)/_components/page-title";
import { TryPracticeLinks } from "@/app/(user)/(public)/_components/try-practice-links";
import { PRACTICE_SCROLL_ANCHOR_ID } from "@/app/(user)/(public)/practice/_lib/scroll-anchor";
import { createNamespaceMetadata } from "@/app/_lib/metadata";

import { ReferenceDemoBoard } from "./_components/reference-demo-board";
import { ReferenceDemoSpotlightTour } from "./_components/reference-demo-spotlight-tour";

export async function generateMetadata(): Promise<Metadata> {
  return createNamespaceMetadata("reference.demo", {
    path: "/reference/demo",
  });
}

export default async function ReferenceDemoPage() {
  const tHub = await getTranslations("reference");
  const t = await getTranslations("reference.demo");

  return (
    // 練習の答え合わせと同じく、スクロール先をタイトル帯ではなく盤面に置く
    // （ReferenceDemoBoard がスクロールする）
    <ContentContainer
      id={PRACTICE_SCROLL_ANCHOR_ID}
      fillViewport
      breadcrumb={[
        { label: tHub("title"), href: "/reference" },
        { label: t("title") },
      ]}
    >
      <PageTitle action={<ReferenceDemoSpotlightTour />}>
        {t("title")}
      </PageTitle>
      <ReferenceDemoBoard />
      <TryPracticeLinks />
    </ContentContainer>
  );
}
