/**
 * 学ぶ（カリキュラム目次）
 *
 * @description
 * セクション（基礎 / 符 / 役 / 点数計算）ごとに章をグルーピングし、
 * 読了状態・進捗率・「次はここから」ナビゲーションを表示する目次ページ。
 * @flow
 * ユーザーは各章カードから対応する `/learn/<slug>` へ遷移する。
 * 未認証ユーザーでも進捗は空として表示され、最初の章が「次はここから」となる。
 */
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ContentContainer } from "@/app/_components/content-container";
import { PageTitle } from "@/app/_components/page-title";
import { SectionTitle } from "@/app/_components/section-title";
import { createMetadata } from "@/app/_lib/metadata";
import { ChapterProgressBadge } from "./_components/chapter-progress-badge";
import { CurriculumProgressBar } from "./_components/curriculum-progress-bar";
import {
  CURRICULUM,
  CURRICULUM_SECTIONS,
  type CurriculumChapter,
  type CurriculumSection,
  getChapterI18nPath,
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
    <ContentContainer>
      <PageTitle>{t("index.pageTitle")}</PageTitle>
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
          <section key={section} className="mt-10">
            <SectionTitle>{t(`sections.${section}`)}</SectionTitle>
            <ul className="mt-4 space-y-3">
              {chapters.map((ch) => {
                const isRead = readSlugs.has(ch.slug);
                const isNext = !allCompleted && next?.slug === ch.slug;
                const path = getChapterI18nPath(ch);
                return (
                  <li key={ch.slug}>
                    <Link
                      href={`/learn/${ch.slug}`}
                      className="block rounded-xl border border-surface-200 bg-white p-5 shadow-sm transition-colors hover:bg-surface-50 hover:ring-1 hover:ring-primary-200"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-base font-semibold text-surface-900">
                              {t(`${path}.title`)}
                            </span>
                            {isNext && (
                              <span className="inline-flex shrink-0 items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                                {t("index.nextChapterBadge")}
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-xs text-surface-500">
                            {t(`${path}.description`)}
                          </p>
                        </div>
                        <ChapterProgressBadge isRead={isRead} />
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
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
