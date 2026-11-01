/**
 * レッスン（目次）
 *
 * @description
 * セクション（はじめに / 満貫 / 役 / 符 / 点数計算 / 記憶術）ごとにレッスン（章）を
 * グルーピングし、完了の印・進捗率・「次はここから」ナビゲーションを表示する
 * 目次ページ。表示は Zenn の書籍目次風のシンプルな縦列リスト。ナビゲーションの
 * 「レッスン」の行き先。段級位の行程に属さない章（はじめに・記憶術）もここに並ぶ —
 * 級ごとの見え方は道場が持つ。
 * @flow
 * ユーザーは各レッスンのタイトル Link から対応する `/lessons/<slug>` へ遷移する。
 * 未認証ユーザーでも進捗は空として表示され、最初のレッスンが「次はここから」となる。
 *
 * 完了を cookie から読むため動的ルート。レッスンページ（`/lessons/<slug>`）は静的なので、
 * 目次だけが持つ loading.tsx がレッスンの祖先にならないよう route group に退避している
 * （`loading-boundaries.test.ts` 参照）。
 *
 * 行は `#chapter-<slug>` で指せる。章の抜粋（練習の説明ページ等）の
 * 「目次へ」がその位置へ着地させるのに使う。
 *
 * `?rank=<級>` を付けると、その級の前提レッスンだけに絞った目次になる
 * （ダッシュボード・道場の級の進み具合の「学ぶ」の行き先）。進捗バーと
 * 「次はここから」もその級の中で数え、下に全レッスンへのリンクを置く。
 * 未知の級・前提レッスンを持たない級は絞らずに全体を出す。絞った目次は
 * 絞り込みのチップを持たない — 級ごとの一覧は道場が持ち、ここでは
 * 「この級のぶんだけ見る → 全体へ戻る」の往復だけを用意する。
 */
import type { Metadata } from "next";
import { Fragment } from "react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { HashAnchorScroll } from "@/app/_components/hash-anchor-scroll";
import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import { ContentContainer } from "@/app/(user)/_components/content-container";
import { LinkRowList } from "@/app/(user)/_components/link-row";
import { NativeAdRow } from "@/app/(user)/_components/native-ad-row";
import { PageTitle } from "@/app/(user)/_components/page-title";
import { SectionTitle } from "@/app/(user)/_components/section-title";
import { createNamespaceMetadata } from "@/app/_lib/metadata";
import { getNativeAdPlacements } from "@/lib/ads/creatives";
import { adIndexAfterGroup } from "@mahjong-scoring/features/ads/spacing";
import { CurriculumProgressBar } from "../_components/curriculum-progress-bar";
import { CurriculumToc } from "../_components/curriculum-toc";
import {
  LESSON_CHAPTERS,
  CURRICULUM_SECTIONS,
  chaptersBySection,
  isColumnChapter,
  pickNextChapter,
  type CurriculumChapterSlug,
} from "@mahjong-scoring/features/curriculum/registry";
import {
  rankBySlug,
  type RankDefinition,
} from "@mahjong-scoring/features/ranks/registry";
import { fetchCompletedLessonSlugs } from "../_lib/lesson-progress";
import { LESSONS_RANK_PARAM } from "../_lib/lessons-web-routes";
import { LESSONS_PATH } from "@mahjong-scoring/features/routes";

interface LearnIndexPageProps {
  readonly searchParams: Promise<
    Readonly<Record<string, string | string[] | undefined>>
  >;
}

/** `?rank=` から絞り込む級を引く。未知の級・前提レッスンを持たない級は絞らない */
function resolveRankFilter(
  value: string | string[] | undefined,
): RankDefinition | undefined {
  if (typeof value !== "string") return undefined;
  const rank = rankBySlug(value);
  if (rank === undefined || rank.learnChapterSlugs.length === 0) {
    return undefined;
  }
  return rank;
}

export async function generateMetadata(): Promise<Metadata> {
  return createNamespaceMetadata("learnCurriculum.index", {
    title: "pageTitle",
    description: "pageDescription",
    path: LESSONS_PATH,
  });
}

export default async function LearnIndexPage({
  searchParams,
}: LearnIndexPageProps) {
  const rank = resolveRankFilter((await searchParams)[LESSONS_RANK_PARAM]);
  if (rank !== undefined) return <RankLessonsIndex rank={rank} />;

  const [t, completedSlugs, ads] = await Promise.all([
    getTranslations("learnCurriculum"),
    fetchCompletedLessonSlugs(),
    getNativeAdPlacements("learn-index-native-ad"),
  ]);
  const next = pickNextChapter(completedSlugs);
  const allCompleted = !next;

  const grouped = chaptersBySection();

  return (
    <ContentContainer breadcrumb={[{ label: t("index.pageTitle") }]}>
      <PageTitle>{t("index.pageTitle")}</PageTitle>
      <HashAnchorScroll />

      <div className="space-y-8">
        <CurriculumProgressBar
          completedCount={completedSlugs.size}
          totalCount={LESSON_CHAPTERS.length}
          allCompleted={allCompleted}
        />

        {CURRICULUM_SECTIONS.map((section, index) => {
          const chapters = grouped.get(section) ?? [];
          if (chapters.length === 0) return undefined;
          const adIndex = adIndexAfterGroup(index);
          const ad = adIndex === undefined ? undefined : ads[adIndex];
          return (
            <Fragment key={section}>
              <CurriculumToc
                section={section}
                chapters={chapters}
                completedSlugs={completedSlugs}
                nextSlug={next?.slug}
                anchored
                headingLevel={2}
              />
              {/* 広告はセクションの切れ目に 1 行ずつ（位置は
                  adIndexAfterGroup）。セクションの中（章の並び）には
                  入れない — レッスンの順序は学習の順序で、間に挟まると順路が途切れる。
                  目次は枠を持たない（印と破線だけ）ので、広告の行も枠を描かない */}
              {ad && (
                <LinkRowList inset>
                  <NativeAdRow creative={ad} />
                </LinkRowList>
              )}
            </Fragment>
          );
        })}

        {allCompleted && (
          <p className="text-center text-sm text-surface-600">
            {t("index.allCompletedMessage")}
          </p>
        )}
      </div>
    </ContentContainer>
  );
}

/**
 * 1 つの級の前提レッスンだけに絞った目次
 * 級で絞ったレッスン目次
 *
 * 進捗バーと「次はここから」はその級のレッスンの中で数える — 全体の数を
 * 出すと「学ぶ 3 / 5」から来た人が見る数と食い違う。広告は置かない
 * （セクションが 1〜2 個の短い一覧で、切れ目に挟むと広告が主役になる）。
 */
async function RankLessonsIndex({ rank }: { readonly rank: RankDefinition }) {
  const [t, tRanks, completedSlugs] = await Promise.all([
    getTranslations("learnCurriculum"),
    getTranslations("ranks"),
    fetchCompletedLessonSlugs(),
  ]);
  const rankSlugs: ReadonlySet<CurriculumChapterSlug> = new Set(
    rank.learnChapterSlugs,
  );
  const grouped = chaptersBySection();
  const chapters = CURRICULUM_SECTIONS.flatMap(
    (section) => grouped.get(section) ?? [],
  ).filter((chapter) => rankSlugs.has(chapter.slug));
  const lessons = chapters.filter((chapter) => !isColumnChapter(chapter));
  const completedCount = lessons.filter((chapter) =>
    completedSlugs.has(chapter.slug),
  ).length;
  const next = lessons.find((chapter) => !completedSlugs.has(chapter.slug));
  const title = t("index.rankFilterTitle", {
    rank: tRanks(`names.${rank.slug}`),
  });

  return (
    <ContentContainer
      breadcrumb={[
        { label: t("index.pageTitle"), href: LESSONS_PATH },
        { label: title },
      ]}
    >
      <PageTitle>{t("index.pageTitle")}</PageTitle>

      <section className="space-y-6">
        <SectionTitle>{title}</SectionTitle>
        <CurriculumProgressBar
          completedCount={completedCount}
          totalCount={lessons.length}
          allCompleted={next === undefined}
        />
        <div className="space-y-6">
          {CURRICULUM_SECTIONS.map((section) => {
            const sectionChapters = chapters.filter(
              (chapter) => chapter.section === section,
            );
            if (sectionChapters.length === 0) return undefined;
            return (
              <CurriculumToc
                key={section}
                section={section}
                chapters={sectionChapters}
                completedSlugs={completedSlugs}
                nextSlug={next?.slug}
                headingLevel={3}
              />
            );
          })}
        </div>
        <div className="text-center">
          <Link
            href={LESSONS_PATH}
            className={`text-sm font-medium ${TEXT_LINK_CLASSES}`}
          >
            {t("index.allLessonsLink")}
          </Link>
        </div>
      </section>
    </ContentContainer>
  );
}
