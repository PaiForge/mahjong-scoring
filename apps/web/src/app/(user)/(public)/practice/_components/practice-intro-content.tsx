import type { ReactNode } from "react";
import { HowToPlaySection } from "./how-to-play-section";
import { PracticeStartCta } from "./practice-start-cta";
import { buildPracticeStartCtaLabels } from "../_lib/practice-start-cta-labels";
import { getTranslations } from "next-intl/server";
import { ChapterTocList } from "@/app/(user)/(public)/learn/_components/chapter-toc-list";
import { LinkRow, LinkRowList } from "@/app/(user)/_components/link-row";
import { CurriculumTocLink } from "@/app/(user)/(public)/learn/_components/curriculum-toc-link";
import type { CurriculumChapterSlug } from "@/app/(user)/(public)/learn/_lib/curriculum";
import type { PracticeMenuSlug } from "@/lib/db/practice-menu-types";
import { rankRequiringMenu } from "@/lib/ranks/registry";
import { ContentContainer } from "@/app/(user)/_components/content-container";
import { PageTitle } from "@/app/(user)/_components/page-title";
import { SectionTitle } from "@/app/(user)/_components/section-title";
import { LinkButton } from "@/app/(user)/_components/link-button";
import { PlayIcon } from "@/app/(user)/_components/icons/play-icon";
import { practiceMenuBySlug } from "@/lib/db/practice-menu-types";
import {
  isExamMenu,
  practiceListHref,
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
 * 教本の章のセクションは、練習と昇級試験で見出しも中身の出どころも変わる。
 *
 * - 通常の練習は「関連する教本の章」。カタログの `learnChapter` が持つ 1 章で、
 *   読んでおくと解きやすいという程度の関係
 * - 昇級試験は「前提となる教本の章」。合格に必要な知識の全体なので、
 *   段級位レジストリがそのランクに宣言した章をすべて出す（1 章ではない）。
 *   道場が出す前提章と同じ集合・同じ見出しで、出どころも同じレジストリ
 *
 * どちらも練習ページ側でパスを渡したり表示可否を切り替えたりはしない。
 * 見た目は目次（`ChapterTocList`）をそのまま使い、ダッシュボードの
 * 「教本の続き」や `/learn` と同じ書式に揃える。章タイトル・説明文も
 * カリキュラム側の文言をそのまま使うため、練習ごとのリンク文言は持たない。
 */
export async function PracticeIntroContent({
  namespace,
  slug,
  showTraining = false,
  howToPlay,
  notice,
}: PracticeIntroContentProps) {
  const t = await getTranslations(namespace);
  const tc = await getTranslations("challenge");
  const tp = await getTranslations("practice");
  const tt = await getTranslations("training");
  const tDojo = await getTranslations("dojo");
  const tRanks = await getTranslations("ranks");
  const isExam = isExamMenu(slug);
  // 昇級試験は練習一覧のカードにならず道場から入るため、親も道場にする
  const parent = isExam
    ? { label: tDojo("title"), href: "/dojo" }
    : { label: tp("title"), href: "/practice" };

  // 昇級試験は段級位レジストリの前提章をすべて、通常の練習はカタログの
  // 関連章 1 件を出す。どちらも持たない練習ではセクションごと出さない。
  // 見出しは道場と同じ文言を引く（同じ集合を別の名前で呼ばないため）。
  const examRank = isExam
    ? rankRequiringMenu(practiceMenuBySlug(slug).menuType)?.rank
    : undefined;
  const chapterSlugs: readonly CurriculumChapterSlug[] = examRank
    ? examRank.learnChapterSlugs
    : ([practiceMenuFromCatalog(slug)?.learnChapter].filter(
        (chapterSlug) => chapterSlug !== undefined,
      ) as readonly CurriculumChapterSlug[]);
  const chaptersTitle = examRank
    ? tDojo("chaptersTitle")
    : tp("requiredKnowledge");

  return (
    <ContentContainer breadcrumb={[parent, { label: t("title") }]}>
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

        {chapterSlugs.length > 0 && (
          <div className="space-y-3">
            <SectionTitle>{chaptersTitle}</SectionTitle>
            <ChapterTocList slugs={chapterSlugs} readSlugs={NO_READ_SLUGS} />
            <CurriculumTocLink />
          </div>
        )}

        {/* 前提章の下に「その級の練習」への行リンクを置く。試験に落ちた人が
            次に行く先は教本の読み直しだけではなく、同じ範囲を数える練習でも
            ある。ダッシュボードが試験へ送るのと同じ行リンクで、押しても
            試験は始まらないことを見た目の重みでも揃える。 */}
        {examRank && (
          <LinkRowList>
            <LinkRow
              href={practiceListHref({ kind: "rank", value: examRank.slug })}
              leading={
                <span className="text-base" aria-hidden="true">
                  ✏️
                </span>
              }
              title={tRanks("practiceLink.title", {
                rank: tRanks(`names.${examRank.slug}`),
              })}
              description={tRanks("practiceLink.description")}
            />
          </LinkRowList>
        )}
      </div>
    </ContentContainer>
  );
}
