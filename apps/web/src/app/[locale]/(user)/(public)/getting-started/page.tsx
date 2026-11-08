/**
 * はじめ方ガイド
 *
 * @description 初めて訪れたユーザー向けの始め方ガイド。基礎を学ぶ→練習で鍛える→
 * 早見表で確認する3ステップで点数計算の学習フローを案内する。LP の「はじめよう」
 * ボタンの遷移先。SEO 重視で SSR。
 * @flow 各ステップカードの CTA から体験(/try/agari-score)・符の計算の体験(/try/mentsu-fu)・
 * 学習(/lessons)へ遷移する。2 枚目のカードの補助リンクは練習一覧(/practice)へ。ページ下部からアカウント登録(/sign-up)へ誘導する。
 *
 * 「まずは体験」は和了形の点数計算（/practice/agari-score）ではなく固定 1 問の体験ページへ送る。
 * 和了形の点数計算は入口が設定画面で、何も見ていない人に出題条件の判断を求めるうえ、
 * 未ログインの無料枠（1 日 1 問）をその 1 問で使い切る。
 * 「簡単な問題を解く」も練習の play へは送らない。開いた瞬間にチャレンジが
 * 始まるため、レッスンの確認問題を 1 問だけ解く体験ページへ送る。
 *
 * 英語のページでも主導線を英語で閉じる。3 つの CTA（体験・符の体験・レッスン）と
 * 補助リンク（練習一覧）は英語でも公開しているので、`resolveNavTargetFor` で
 * 同じ言語の href を張る（英語なら `/en/...`。hash は残る）。登録ページだけは
 * 英語で未公開のため、登録パネルは「日本語のみ」の印付きで日本語の登録へ送る
 * （`SignUpPanel` の `navTarget`）。英語の登録ページが公開されれば、何も書き換えず
 * 同じ言語の href に変わる。
 */
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { ContentContainer } from "@/app/[locale]/(user)/_components/content-container";
import { PageTitle } from "@/app/[locale]/(user)/_components/page-title";
import { BookIcon } from "@/app/[locale]/(user)/_components/icons/book-icon";
import { CheckIcon } from "@/app/[locale]/(user)/_components/icons/check-icon";
import { PlayIcon } from "@/app/[locale]/(user)/_components/icons/play-icon";
import { createNamespaceMetadata } from "@/app/_lib/metadata";
import { PRACTICE_SCROLL_HASH } from "@/app/[locale]/(user)/(public)/practice/_lib/scroll-anchor";

import { SignUpPanel } from "@/app/[locale]/(user)/_components/sign-up-panel";

import { resolveNavTargetFor } from "@/app/[locale]/(user)/_components/_lib/locale-nav-target";

import { StepCard } from "./_components/step-card";
import { LESSONS_PATH, PRACTICE_PATH } from "@mahjong-scoring/features/routes";
import { prepareRouteLocale } from "@/i18n/route-locale";

/** 登録ページ（ロケール非依存の href） */
const SIGN_UP_PATH = "/sign-up";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/getting-started">): Promise<Metadata> {
  const locale = await prepareRouteLocale(params, "/getting-started");
  return createNamespaceMetadata("gettingStarted", {
    title: "pageTitle",
    description: "pageDescription",
    path: "/getting-started",
    locale,
  });
}

export default async function GettingStartedPage({
  params,
}: PageProps<"/[locale]/getting-started">) {
  const locale = await prepareRouteLocale(params, "/getting-started");
  const t = await getTranslations("gettingStarted");

  return (
    <ContentContainer breadcrumb={[{ label: t("pageTitle") }]}>
      <PageTitle>{t("pageTitle")}</PageTitle>

      <div className="space-y-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <StepCard
            icon={<CheckIcon className="size-7" />}
            iconClassName="bg-brand-subtle text-brand-subtle-foreground"
            title={t("steps.tryout.title")}
            description={t("steps.tryout.description")}
            ctaLabel={t("steps.tryout.cta")}
            ctaTarget={resolveNavTargetFor(
              `/try/agari-score${PRACTICE_SCROLL_HASH}`,
              locale,
            )}
          />
          <StepCard
            icon={<PlayIcon className="size-7" />}
            iconClassName="bg-brand-subtle text-brand-subtle-foreground"
            title={t("steps.practice.title")}
            description={t("steps.practice.description")}
            ctaLabel={t("steps.practice.cta")}
            ctaTarget={resolveNavTargetFor("/try/mentsu-fu", locale)}
            subLabel={t("steps.practice.sub")}
            subTarget={resolveNavTargetFor(PRACTICE_PATH, locale)}
          />
          <StepCard
            icon={<BookIcon className="size-7" />}
            iconClassName="bg-amber-50 text-amber-800"
            title={t("steps.learn.title")}
            description={t("steps.learn.description")}
            ctaLabel={t("steps.learn.cta")}
            ctaTarget={resolveNavTargetFor(LESSONS_PATH, locale)}
          />
        </div>

        <SignUpPanel
          title={t("signUp.title")}
          description={t("signUp.description")}
          cta={t("signUp.cta")}
          navTarget={resolveNavTargetFor(SIGN_UP_PATH, locale)}
        />
      </div>
    </ContentContainer>
  );
}
