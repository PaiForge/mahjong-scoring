import type { ReactNode } from "react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ContentContainer } from "@/app/_components/content-container";
import { PageTitle } from "@/app/_components/page-title";
import { SectionTitle } from "@/app/_components/section-title";
import { PrimaryLinkButton } from "@/app/_components/primary-link-button";
import { BookIcon } from "@/app/_components/icons/book-icon";
import { InfinityIcon } from "@/app/_components/icons/infinity-icon";
import { PRACTICE_SCROLL_HASH } from "../_lib/scroll-anchor";

interface PracticeIntroContentProps {
  /** i18n ネームスペース（例: "jantouFu"） */
  readonly namespace: string;
  /** 練習スラッグ（例: "jantou-fu"） */
  readonly slug: string;
  /** 学習ページへのリンクを表示するかどうか（デフォルト: true） */
  readonly showLearnLink?: boolean;
  /** トレーニングモードへのボタンを表示するかどうか（デフォルト: false） */
  readonly showTraining?: boolean;
  /**
   * 問題方式（遊び方）のビジュアルデモ。渡された場合は説明文の代わりに
   * 「問題方式」セクションとして実際の出題例を表示する。
   */
  readonly howToPlay?: ReactNode;
}

/**
 * 練習説明ページの共通コンテンツ
 * 練習説明共通
 */
export async function PracticeIntroContent({
  namespace,
  slug,
  showLearnLink = true,
  showTraining = false,
  howToPlay,
}: PracticeIntroContentProps) {
  const t = await getTranslations(namespace);
  const tc = await getTranslations("challenge");
  const tp = await getTranslations("practice");
  const tt = await getTranslations("training");

  return (
    <ContentContainer
      breadcrumb={[
        { label: tp("title"), href: "/practice" },
        { label: t("title") },
      ]}
    >
      <PageTitle>{t("title")}</PageTitle>
      {/* カード内のセクション間マージンは space-y で等間隔に統一する */}
      <div className="space-y-8">
        {/* 説明文は問題方式デモが冗長になるため、デモ未指定時のみ表示 */}
        {!howToPlay && (
          <p className="text-sm text-surface-500">{t("description")}</p>
        )}

        {howToPlay && (
          <div>
            <SectionTitle className="mb-4">{t("howToPlay.title")}</SectionTitle>
            <p className="mb-4 text-sm text-surface-600">
              {t("howToPlay.lead")}
            </p>
            <div className="rounded-xl border border-surface-200 bg-surface-50 p-6">
              {howToPlay}
            </div>
          </div>
        )}

        {showTraining ? (
          <div className="flex flex-col gap-5">
            <div className="flex w-full flex-col items-center gap-1.5">
              <PrimaryLinkButton
                href={`/practice/${slug}/play${PRACTICE_SCROLL_HASH}`}
                className="w-full px-8 py-3"
              >
                {tc("startButton")}
              </PrimaryLinkButton>
              <p className="text-xs text-surface-400">{tp("modeChallengeHint")}</p>
            </div>

            <div className="flex w-full items-center gap-3 text-xs text-surface-400">
              <span className="h-px flex-1 bg-surface-200" />
              <span>{tp("orDivider")}</span>
              <span className="h-px flex-1 bg-surface-200" />
            </div>

            <div className="flex w-full flex-col items-center gap-1.5">
              <Link
                href={`/practice/${slug}/training${PRACTICE_SCROLL_HASH}`}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-primary-500 px-8 py-3 text-sm font-semibold text-primary-600 transition-colors hover:bg-primary-50"
              >
                <InfinityIcon className="size-4" />
                {tt("startButton")}
              </Link>
              <p className="text-xs text-surface-400">{tp("modeTrainingHint")}</p>
            </div>
          </div>
        ) : (
          <div>
            <PrimaryLinkButton
              href={`/practice/${slug}/play${PRACTICE_SCROLL_HASH}`}
              className="w-full px-8 py-3"
            >
              {tc("startButton")}
            </PrimaryLinkButton>
          </div>
        )}

        {showLearnLink && (
          <div className="space-y-3">
            <SectionTitle>{tp("requiredKnowledge")}</SectionTitle>
            <Link
              href={`/learn/${slug}`}
              className="group flex items-start gap-4 rounded-xl border border-surface-200 bg-white p-5 transition-colors hover:border-primary-300"
            >
              <BookIcon className="mt-0.5 size-5 shrink-0 text-primary-600" />
              <div>
                <p className="font-medium text-surface-900 transition-colors group-hover:text-primary-700">
                  {t("learnLink")}
                </p>
                {t.has("learnLinkDescription") && (
                  <p className="mt-1 text-sm text-surface-500">
                    {t("learnLinkDescription")}
                  </p>
                )}
              </div>
            </Link>
          </div>
        )}
      </div>
    </ContentContainer>
  );
}
