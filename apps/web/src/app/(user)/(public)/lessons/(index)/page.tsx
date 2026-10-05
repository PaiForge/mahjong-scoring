/**
 * レッスン（目次）
 *
 * @description
 * セクション（基礎 / 満貫 / 役 / 符 / 点数計算 / 記憶術）ごとにレッスン（章）を
 * グルーピングし、完了の印・進捗率・「次はここから」ナビゲーションを表示する
 * 目次ページ。表示は Zenn の書籍目次風のシンプルな縦列リスト。ナビゲーションの
 * 「レッスン」の行き先。段級位の行程に属さない章（基礎・記憶術）もここに並ぶ —
 * 級ごとの見え方は道場が持つ。
 * @flow
 * ユーザーは各レッスンのタイトル Link から対応する `/lessons/<slug>` へ遷移する。
 * 未認証ユーザーでも進捗は空として表示され、最初のレッスンが「次はここから」となる。
 *
 * 完了を cookie から読むため動的ルート。レッスンページ（`/lessons/<slug>`）は静的なので、
 * 目次だけが持つ loading.tsx がレッスンの祖先にならないよう route group に退避している
 * （`loading-boundaries.test.ts` 参照）。
 *
 * 行は `#chapter-<slug>` で指せる。章の抜粋（練習の説明ページ・道場の級の
 * 進み具合）の「目次へ」がその位置へ着地させるのに使う。
 */
import type { Metadata } from "next";
import { Fragment } from "react";
import { getTranslations } from "next-intl/server";
import { HashAnchorScroll } from "@/app/(user)/_components/hash-anchor-scroll";
import { ContentContainer } from "@/app/(user)/_components/content-container";
import { LinkRowList } from "@/app/(user)/_components/link-row";
import { NativeAdRow } from "@/app/(user)/_components/native-ad-row";
import { PageTitle } from "@/app/(user)/_components/page-title";
import { SectionTitle } from "@/app/(user)/_components/section-title";
import { createNamespaceMetadata } from "@/app/_lib/metadata";
import { getNativeAdPlacements } from "@/lib/ads/creatives";
import { adIndexAfterGroup } from "@/lib/ads/spacing";
import { CurriculumProgressBar } from "../_components/curriculum-progress-bar";
import { CurriculumToc } from "../_components/curriculum-toc";
import {
  CURRICULUM,
  CURRICULUM_SECTIONS,
  chaptersBySection,
  pickNextChapter,
} from "@mahjong-scoring/features/curriculum/registry";
import { fetchCompletedLessonSlugs } from "../_lib/lesson-progress";

export async function generateMetadata(): Promise<Metadata> {
  return createNamespaceMetadata("learnCurriculum.index", {
    title: "pageTitle",
    description: "pageDescription",
    path: "/lessons",
  });
}

export default async function LearnIndexPage() {
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
        <div className="space-y-3">
          <SectionTitle>{t("index.sectionTitle")}</SectionTitle>
          <p className="text-sm text-surface-500">
            {t("index.pageDescription")}
          </p>
        </div>

        <CurriculumProgressBar
          completedCount={completedSlugs.size}
          totalCount={CURRICULUM.length}
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
              />
              {/* 広告はセクションの切れ目に 1 行ずつ（位置は
                  adIndexAfterGroup）。セクションの中（章の並び）には
                  入れない — レッスンの順序は学習の順序で、間に挟まると順路が途切れる */}
              {ad && (
                <LinkRowList>
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
