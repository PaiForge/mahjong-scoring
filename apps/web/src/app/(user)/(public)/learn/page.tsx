/**
 * 学ぶ（カリキュラム目次）
 *
 * @description
 * セクション（基礎 / 符 / 役 / 点数計算）ごとに章をグルーピングし、
 * 読了状態・進捗率・「次はここから」ナビゲーションを表示する目次ページ。
 * 表示は Zenn の書籍目次風のシンプルな縦列リスト。
 * @flow
 * ユーザーは各章のタイトル Link から対応する `/learn/<slug>` へ遷移する。
 * 未認証ユーザーでも進捗は空として表示され、最初の章が「次はここから」となる。
 */
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ContentContainer } from "@/app/_components/content-container";
import { PageTitle } from "@/app/_components/page-title";
import { SectionTitle } from "@/app/_components/section-title";
import { createMetadata } from "@/app/_lib/metadata";
import { CurriculumProgressBar } from "./_components/curriculum-progress-bar";
import { CurriculumToc } from "./_components/curriculum-toc";
import {
  CURRICULUM,
  CURRICULUM_SECTIONS,
  type CurriculumChapter,
  type CurriculumSection,
  pickNextChapter,
} from "./_lib/curriculum";
import { fetchReadChapterSlugs } from "./_lib/progress";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("learnCurriculum.index");
  return createMetadata({
    title: t("pageTitle"),
    description: t("pageDescription"),
  });
}

export default async function LearnIndexPage() {
  const t = await getTranslations("learnCurriculum");
  const readSlugs = await fetchReadChapterSlugs();
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

      <SectionTitle>{t("index.sectionTitle")}</SectionTitle>
      <p className="mt-3 text-sm text-surface-500">
        {t("index.pageDescription")}
      </p>

      <div className="mt-6">
        <CurriculumProgressBar
          readCount={readSlugs.size}
          totalCount={CURRICULUM.length}
          allCompleted={allCompleted}
        />
      </div>

      {CURRICULUM_SECTIONS.map((section) => {
        const chapters = grouped.get(section) ?? [];
        if (chapters.length === 0) return undefined;
        return (
          <div key={section} className="mt-8">
            <CurriculumToc
              section={section}
              chapters={chapters}
              readSlugs={readSlugs}
              nextSlug={next?.slug}
            />
          </div>
        );
      })}

      {allCompleted && (
        <p className="mt-8 text-center text-sm text-surface-600">
          {t("index.allCompletedMessage")}
        </p>
      )}
    </ContentContainer>
  );
}
