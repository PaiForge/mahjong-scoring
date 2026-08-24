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
import { getTranslations } from "next-intl/server";

import { ContentContainer } from "@/app/(user)/_components/content-container";
import { PageTitle } from "@/app/(user)/_components/page-title";
import { BookIcon } from "@/app/(user)/_components/icons/book-icon";
import { CheckIcon } from "@/app/(user)/_components/icons/check-icon";
import { PlayIcon } from "@/app/(user)/_components/icons/play-icon";
import { createNamespaceMetadata } from "@/app/_lib/metadata";

import { StepCard } from "./_components/step-card";
import { LinkButton } from "@/app/(user)/_components/link-button";

export async function generateMetadata(): Promise<Metadata> {
  return createNamespaceMetadata("gettingStarted", {
    title: "pageTitle",
    description: "pageDescription",
    path: "/getting-started",
  });
}

export default async function GettingStartedPage() {
  const t = await getTranslations("gettingStarted");

  return (
    <ContentContainer breadcrumb={[{ label: t("pageTitle") }]}>
      <PageTitle>{t("pageTitle")}</PageTitle>

      <div className="space-y-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <StepCard
            icon={<CheckIcon className="size-7" />}
            iconClassName="bg-primary-200 text-primary-800"
            title={t("steps.tryout.title")}
            description={t("steps.tryout.description")}
            ctaLabel={t("steps.tryout.cta")}
            ctaHref="/practice/score"
          />
          <StepCard
            icon={<PlayIcon className="size-7" />}
            iconClassName="bg-primary-200 text-primary-800"
            title={t("steps.practice.title")}
            description={t("steps.practice.description")}
            ctaLabel={t("steps.practice.cta")}
            ctaHref="/practice/jantou-fu/play"
            subLabel={t("steps.practice.sub")}
            subHref="/practice"
          />
          <StepCard
            icon={<BookIcon className="size-7" />}
            iconClassName="bg-amber-200 text-amber-800"
            title={t("steps.learn.title")}
            description={t("steps.learn.description")}
            ctaLabel={t("steps.learn.cta")}
            ctaHref="/learn"
          />
        </div>

        <section className="space-y-4 rounded-lg border-3 border-ink bg-surface-50 px-6 py-8 text-center">
          <h2 className="text-lg font-semibold text-surface-900">
            {t("signUp.title")}
          </h2>
          <p className="mx-auto max-w-xl text-sm leading-relaxed text-surface-500">
            {t("signUp.description")}
          </p>
          <LinkButton href="/sign-up" size="lg">
            {t("signUp.cta")}
          </LinkButton>
        </section>
      </div>
    </ContentContainer>
  );
}
