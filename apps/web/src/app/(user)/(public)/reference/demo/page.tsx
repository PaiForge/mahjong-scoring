/**
 * 早見表の連動サンプル
 *
 * @description LP の「早見表」の紹介から開くページ。練習の答え合わせで正解の
 * 点数や役名を押すと、その場で点数表・役一覧がモーダルで開くことを、本番と
 * 同じ部品で答え終えた 1 問を置いて試させる。解く手順は省く（解く体験は
 * /try が担う）。見え方は練習の答え合わせに揃え、説明文は置かない — 開いた
 * 直後に盤面へスクロールし、ヘルプツアーが自動で始まって押す場所を示す。
 * 盤面の下に、開いてきた LP へ戻るリンクと、答え合わせから同じく早見表を
 * 開ける練習の入口を置く。無料の点数計算 2 つ（答え合わせの正解の点数と翻数の
 * 内訳の役名が押せる）を先に、回数制限のある実戦練習 2 つ（練習一覧の
 * 「実戦練習」と同じカード）を後に並べる。実戦練習の残り回数は
 * クライアントで引くので、cookie を読まない静的ページのまま。
 *
 * @flow ヘルプツアーで役と点数が照らされる → 役名を押す → 役一覧がその役に着地して開く / 点数を押す → 正解の
 * セルをハイライトした点数表が開く → 練習のカードから説明ページへ / LP へ戻る
 */
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { ContentContainer } from "@/app/(user)/_components/content-container";
import { PageTitle } from "@/app/(user)/_components/page-title";
import { SectionTitle } from "@/app/(user)/_components/section-title";
import { CatalogPracticeCard } from "@/app/(user)/(public)/practice/_components/catalog-practice-card";
import {
  AgariScorePracticeBanner,
  TenpaiScorePracticeBanner,
} from "@/app/(user)/(public)/practice/_components/practical-practice-banners";
import { PRACTICE_SCROLL_ANCHOR_ID } from "@/app/(user)/(public)/practice/_lib/scroll-anchor";
import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
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
      <div className="mt-10 text-center">
        <Link href="/" className={`text-sm ${TEXT_LINK_CLASSES}`}>
          {t("backToHome")}
        </Link>
      </div>
      <section className="mt-10 space-y-4">
        <SectionTitle>{t("practicalTitle")}</SectionTitle>
        <p className="text-sm leading-relaxed text-surface-500">
          {t("practicalDescription")}
        </p>
        {/* 無料の練習を先に置く。下の 2 枚は回数制限（Pro で無制限）が掛かる */}
        <div className="grid gap-4 sm:grid-cols-2">
          <CatalogPracticeCard slug="score-calculation" />
          <CatalogPracticeCard slug="mangan-score-calculation" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <AgariScorePracticeBanner />
          <TenpaiScorePracticeBanner />
        </div>
      </section>
    </ContentContainer>
  );
}
