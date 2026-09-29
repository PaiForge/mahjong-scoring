/**
 * 教本（目次）
 *
 * @description
 * セクション（基礎 / 符 / 役 / 点数計算）ごとに章をグルーピングし、
 * 読了状態・進捗率・「次はここから」ナビゲーションを表示する目次ページ。
 * 表示は Zenn の書籍目次風のシンプルな縦列リスト。
 * @flow
 * ユーザーは各章のタイトル Link から対応する `/learn/<slug>` へ遷移する。
 * 未認証ユーザーでも進捗は空として表示され、最初の章が「次はここから」となる。
 *
 * 読了状態を cookie から読むため動的ルート。章ページ（`/learn/<slug>`）は静的なので、
 * 目次だけが持つ loading.tsx が章の祖先にならないよう route group に退避している
 * （`loading-boundaries.test.ts` 参照）。
 */
import type { Metadata } from "next";
import { Fragment } from "react";
import { getTranslations } from "next-intl/server";
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
  type CurriculumChapter,
  type CurriculumSection,
  pickNextChapter,
} from "../_lib/curriculum";
import { fetchReadChapterSlugs } from "../_lib/progress";

export async function generateMetadata(): Promise<Metadata> {
  return createNamespaceMetadata("learnCurriculum.index", {
    title: "pageTitle",
    description: "pageDescription",
    path: "/learn",
  });
}

export default async function LearnIndexPage() {
  const [t, readSlugs, ads] = await Promise.all([
    getTranslations("learnCurriculum"),
    fetchReadChapterSlugs(),
    getNativeAdPlacements("learn-index-native-ad"),
  ]);
  const next = pickNextChapter(readSlugs);
  const allCompleted = !next;

  const sorted = [...CURRICULUM].sort((a, b) => a.order - b.order);
  const grouped = new Map<CurriculumSection, CurriculumChapter[]>();
  for (const section of CURRICULUM_SECTIONS) grouped.set(section, []);
  for (const chapter of sorted) {
    grouped.get(chapter.section)?.push(chapter);
  }

  return (
    <ContentContainer breadcrumb={[{ label: t("index.pageTitle") }]}>
      <PageTitle>{t("index.pageTitle")}</PageTitle>

      <div className="space-y-8">
        <div className="space-y-3">
          <SectionTitle>{t("index.sectionTitle")}</SectionTitle>
          <p className="text-sm text-surface-500">
            {t("index.pageDescription")}
          </p>
        </div>

        <CurriculumProgressBar
          readCount={readSlugs.size}
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
                readSlugs={readSlugs}
                nextSlug={next?.slug}
              />
              {/* 広告はセクションの切れ目に 1 行ずつ（位置は
                  adIndexAfterGroup）。セクションの中（章の並び）には
                  入れない — 章の順序は学習の順序で、間に挟まると順路が途切れる */}
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
