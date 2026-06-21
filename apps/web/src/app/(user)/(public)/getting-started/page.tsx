/**
 * はじめ方ガイド
 *
 * @description 初めて訪れたユーザー向けの始め方ガイド。基礎を学ぶ→練習で鍛える→
 * 早見表で確認する3ステップで点数計算の学習フローを案内する。LP の「はじめよう」
 * ボタンの遷移先。SEO 重視で SSR。
 * @flow 各ステップカードの CTA から学習(/learn)・練習(/practice)・早見表(/reference)へ
 * 遷移する。ページ下部からアカウント登録(/sign-up)へ誘導する。
 */
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { ContentContainer } from "@/app/_components/content-container";
import { PageTitle } from "@/app/_components/page-title";
import { BookIcon } from "@/app/_components/icons/book-icon";
import { PlayIcon } from "@/app/_components/icons/play-icon";
import { TableIcon } from "@/app/_components/icons/table-icon";
import { createMetadata } from "@/app/_lib/metadata";

import { StepCard } from "./_components/step-card";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("gettingStarted");
  return createMetadata({
    title: t("pageTitle"),
    description: t("pageDescription"),
  });
}

export default async function GettingStartedPage() {
  const t = await getTranslations("gettingStarted");

  return (
    <ContentContainer className="space-y-8">
      <div className="text-center">
        <PageTitle>{t("pageTitle")}</PageTitle>
        <p className="mt-3 text-base text-surface-500">{t("headline")}</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <StepCard
          stepLabel={t("stepLabel", { step: 1 })}
          icon={<BookIcon className="size-7" />}
          iconClassName="bg-green-500/10 text-green-600"
          title={t("steps.learn.title")}
          description={t("steps.learn.description")}
          ctaLabel={t("steps.learn.cta")}
          ctaHref="/learn"
          subLabel={t("steps.learn.sub")}
          subHref="/learn/about-this-app"
        />
        <StepCard
          stepLabel={t("stepLabel", { step: 2 })}
          icon={<PlayIcon className="size-7" />}
          iconClassName="bg-primary-500/10 text-primary-600"
          title={t("steps.practice.title")}
          description={t("steps.practice.description")}
          ctaLabel={t("steps.practice.cta")}
          ctaHref="/practice"
          subLabel={t("steps.practice.sub")}
          subHref="/practice/jantou-fu/play"
        />
        <StepCard
          stepLabel={t("stepLabel", { step: 3 })}
          icon={<TableIcon className="size-7" />}
          iconClassName="bg-amber-500/10 text-amber-600"
          title={t("steps.reference.title")}
          description={t("steps.reference.description")}
          ctaLabel={t("steps.reference.cta")}
          ctaHref="/reference"
          subLabel={t("steps.reference.sub")}
          subHref="/leaderboard"
        />
      </div>

      <section className="rounded-lg border border-surface-200 bg-surface-50 px-6 py-8 text-center">
        <h2 className="text-lg font-semibold text-surface-900">
          {t("signUp.title")}
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-surface-500">
          {t("signUp.description")}
        </p>
        <div className="mt-6">
          <Link
            href="/sign-up"
            className="inline-flex items-center justify-center rounded-lg bg-primary-600 px-8 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700"
          >
            {t("signUp.cta")}
          </Link>
        </div>
      </section>
    </ContentContainer>
  );
}
