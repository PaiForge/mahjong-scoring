import type { ReactNode } from "react";
import { HowToPlaySection } from "./how-to-play-section";
import { PracticeStartCta } from "./practice-start-cta";
import { buildPracticeStartCtaLabels } from "../_lib/practice-start-cta-labels";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { CurriculumToc } from "@/app/(user)/(public)/learn/_components/curriculum-toc";
import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import { getChapterBySlug } from "@/app/(user)/(public)/learn/_lib/curriculum";
import type { PracticeMenuSlug } from "@/lib/db/practice-menu-types";
import { ContentContainer } from "@/app/(user)/_components/content-container";
import { PageTitle } from "@/app/(user)/_components/page-title";
import { SectionTitle } from "@/app/(user)/_components/section-title";
import { LinkButton } from "@/app/(user)/_components/link-button";
import { PlayIcon } from "@/app/(user)/_components/icons/play-icon";
import { practiceMenuBySlug } from "@/lib/db/practice-menu-types";
import {
  practiceMenuFromCatalog,
  practicePlayHref,
  practiceTrainingHref,
} from "../_lib/practice-catalog";
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
 * 教本の読了状態を持たない空集合。
 *
 * 「関連する教本の章」は読了チェックを出さないため、読了状態を引かない。ここで
 * 読了状態を取ると認証 Cookie に触れ、静的に配信できる練習説明ページが
 * 全ページ動的レンダリングに落ちる。読了の進捗を見せる場は `/learn` と
 * ダッシュボードが持つ。
 */
const NO_READ_SLUGS: ReadonlySet<string> = new Set();

/**
 * 練習説明ページの共通コンテンツ
 * 練習説明共通
 *
 * @remarks
 * 「関連する教本の章」の教本リンクはカタログの `learnChapter` から引く。練習ページ側で
 * パスを渡したり表示可否を切り替えたりはしない（章との対応はカタログが正典）。
 * 見た目は目次（`CurriculumToc`）をそのまま使い、ダッシュボードの「教本の続き」
 * や `/learn` と同じ書式に揃える。ただし「次はここから」バッジは練習からの
 * 導線では意味を持たないため出さない（`nextSlug` を渡さない）。
 * 章タイトル・説明文もカリキュラム側の文言をそのまま使うため、練習ごとの
 * リンク文言は持たない。
 */
export async function PracticeIntroContent({
  namespace,
  slug,
  showTraining = false,
  howToPlay,
  notice,
}: PracticeIntroContentProps) {
  // 前提知識となる章はカタログが持つ。専用の章を持たない練習では
  // 「関連する教本の章」セクションごと出さない。
  const learnChapter = practiceMenuFromCatalog(slug)?.learnChapter;
  const chapter = learnChapter ? getChapterBySlug(learnChapter) : undefined;
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
            playHref={`${practicePlayHref(slug)}${PRACTICE_SCROLL_HASH}`}
            trainingHref={`${practiceTrainingHref(slug)}${PRACTICE_SCROLL_HASH}`}
            labels={buildPracticeStartCtaLabels(
              { challenge: tc, practice: tp, training: tt },
              practiceMenuBySlug(slug),
            )}
          />
        ) : (
          <LinkButton
            href={`${practicePlayHref(slug)}${PRACTICE_SCROLL_HASH}`}
            size="lg"
            fullWidth
          >
            <PlayIcon className="size-4" />
            {tc("startButton")}
          </LinkButton>
        )}

        {chapter && (
          <div className="space-y-3">
            <SectionTitle>{tp("requiredKnowledge")}</SectionTitle>
            <CurriculumToc
              section={chapter.section}
              chapters={[chapter]}
              readSlugs={NO_READ_SLUGS}
              nextSlug={undefined}
            />
            {/* ダッシュボードの「教本の続き」と同じ、右端に置く目次への導線。
                見出しが「教本の章」と言い切っているため、ここも向こうと同じく
                「目次へ」で何の目次かが伝わる。 */}
            <div className="text-right">
              <Link
                href="/learn"
                className={`text-sm font-medium ${TEXT_LINK_CLASSES}`}
              >
                {tp("viewCurriculumToc")}
              </Link>
            </div>
          </div>
        )}
      </div>
    </ContentContainer>
  );
}
