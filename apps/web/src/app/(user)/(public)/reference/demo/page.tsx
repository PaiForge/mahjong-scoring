/**
 * 早見表の連動サンプル
 *
 * @description LP の「早見表」の紹介から開くページ。練習の答え合わせで正解の
 * 点数や役名を押すと、その場で点数表・役一覧がモーダルで開くことを、本番と
 * 同じ部品で答え終えた 1 問を置いて試させる。解く手順は省く（解く体験は
 * /try が担う）。見え方は練習の答え合わせに揃え、説明文は置かない — 開いた
 * 直後に盤面へスクロールし、ヘルプツアーが自動で始まって押す場所を示す。
 * 盤面の下に、同じ答え合わせで解ける実戦練習の入口（練習一覧の「実戦練習」と
 * 同じカード）と、開いてきた LP へ戻るリンクを置く。カードの残り回数は
 * クライアントで引くので、cookie を読まない静的ページのまま。
 *
 * @flow ヘルプツアーで役と点数が照らされる → 役名を押す → 役一覧がその役に着地して開く / 点数を押す → 正解の
 * セルをハイライトした点数表が開く → 実戦練習のカードから説明ページへ / LP へ戻る
 */
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { ContentContainer } from "@/app/(user)/_components/content-container";
import { PageTitle } from "@/app/(user)/_components/page-title";
import { SectionTitle } from "@/app/(user)/_components/section-title";
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
      <section className="mt-10 space-y-4">
        <SectionTitle>{t("practicalTitle")}</SectionTitle>
        <p className="text-sm leading-relaxed text-surface-500">
          {t("practicalDescription")}
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <AgariScorePracticeBanner />
          <TenpaiScorePracticeBanner />
        </div>
      </section>
      <div className="mt-10 text-center">
        <Link href="/" className={`text-sm ${TEXT_LINK_CLASSES}`}>
          {t("backToHome")}
        </Link>
      </div>
    </ContentContainer>
  );
}
