import type { ReactNode } from "react";
import { HowToPlaySection } from "./how-to-play-section";
import { PracticeStartCta } from "./practice-start-cta";
import { buildPracticeStartCtaLabels } from "../_lib/practice-start-cta-labels";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { chapterHref } from "@/app/(user)/(public)/learn/_lib/curriculum";
import type { PracticeMenuSlug } from "@/lib/db/practice-menu-types";
import { ContentContainer } from "@/app/(user)/_components/content-container";
import { PageTitle } from "@/app/(user)/_components/page-title";
import { SectionTitle } from "@/app/(user)/_components/section-title";
import { LinkButton } from "@/app/(user)/_components/link-button";
import { PlayIcon } from "@/app/(user)/_components/icons/play-icon";
import { BookIcon } from "@/app/(user)/_components/icons/book-icon";
import { practiceMenuBySlug } from "@/lib/db/practice-menu-types";
import { practiceMenuFromCatalog } from "../_lib/practice-catalog";
import { PRACTICE_SCROLL_HASH } from "../_lib/scroll-anchor";

interface PracticeIntroContentProps {
  /** i18n ネームスペース（例: "jantouFu"） */
  readonly namespace: string;
  /** 練習スラッグ（例: "jantou-fu"） */
  readonly slug: PracticeMenuSlug;
  /** トレーニングモードへのボタンを表示するかどうか（デフォルト: false） */
  readonly showTraining?: boolean;
  /**
   * 問題方式（遊び方）のビジュアルデモ。渡された場合は説明文の代わりに
   * 「問題方式」セクションとして実際の出題例を表示する。
   */
  readonly howToPlay?: ReactNode;
  /**
   * 開始ボタンの直前に置く注意書き（昇級試験の合格条件パネル等）。
   * 開始前に必ず目に入る位置に出したい情報のためのスロット。
   */
  readonly notice?: ReactNode;
}

/**
 * 練習説明ページの共通コンテンツ
 * 練習説明共通
 *
 * @remarks
 * 「関連記事」の教本リンクはカタログの `learnChapter` から引く。練習ページ側で
 * パスを渡したり表示可否を切り替えたりはしない（章との対応はカタログが正典）。
 */
export async function PracticeIntroContent({
  namespace,
  slug,
  showTraining = false,
  howToPlay,
  notice,
}: PracticeIntroContentProps) {
  // 前提知識となる章はカタログが持つ。専用の章を持たない練習では
  // 「関連記事」セクションごと出さない。
  const learnChapter = practiceMenuFromCatalog(slug)?.learnChapter;
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
          <HowToPlaySection
            title={t("howToPlay.title")}
            lead={t("howToPlay.lead")}
          >
            {howToPlay}
          </HowToPlaySection>
        )}

        {notice}

        {showTraining ? (
          <PracticeStartCta
            playHref={`/practice/${slug}/play${PRACTICE_SCROLL_HASH}`}
            trainingHref={`/practice/${slug}/training${PRACTICE_SCROLL_HASH}`}
            labels={buildPracticeStartCtaLabels(
              { challenge: tc, practice: tp, training: tt },
              practiceMenuBySlug(slug),
            )}
          />
        ) : (
          <LinkButton
            href={`/practice/${slug}/play${PRACTICE_SCROLL_HASH}`}
            size="lg"
            fullWidth
          >
            <PlayIcon className="size-4" />
            {tc("startButton")}
          </LinkButton>
        )}

        {learnChapter && (
          <div className="space-y-3">
            <SectionTitle>{tp("requiredKnowledge")}</SectionTitle>
            <Link
              href={chapterHref(learnChapter)}
              className="press-sm group flex items-start gap-4 rounded-xl border-3 border-ink bg-white p-5 shadow-sm hover:bg-primary-50"
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
