import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { ContentContainer } from "@/app/(user)/_components/content-container";
import { GlossaryTermModalProvider } from "@/app/(user)/_components/glossary/glossary-term-modal-provider";
import { JsonLd } from "@/app/(user)/_components/json-ld";
import { PageTitle } from "@/app/(user)/_components/page-title";
import { collectTermSlugsInNamespace } from "@/lib/glossary/message-terms";
import { resolveTermPreviews } from "@/lib/glossary/queries";
import {
  getChapterBySlug,
  type CurriculumChapterSlug,
} from "../_lib/curriculum";
import { buildLearnArticleSchema } from "../_lib/json-ld";
import { chapterNamespace } from "../_lib/metadata";
import { formatPublishedDate } from "../_lib/published-date";
import { ChapterNav } from "./chapter-nav";
import { ChapterReadStatus } from "./chapter-read-status";
import { ExamCtaCard } from "./exam-cta-card";
import { LoginPromptCta } from "./login-prompt-cta";
import { PracticeLinkList, PracticeLinkSection } from "./practice-link-card";

interface LearnPageLayoutProps {
  /** 対象章のスラッグ。辞書ネームスペースもここから導出する */
  readonly slug: CurriculumChapterSlug;
  /** ガイドコンテンツ */
  readonly children: ReactNode;
}

/**
 * 学習章ページの共通レイアウト
 * 学習章レイアウト
 *
 * 章本文の前後に以下を描画する:
 * - ページタイトル（`<camelCase(slug)>.learn.pageTitle`）
 * - 章本文（children）— 本文中の用語リンクが開くモーダルごと包む
 * - 読了トグル（認証時）/ ログイン導線（未認証時）— `ChapterReadStatus` が
 *   クライアントで出し分ける
 * - 対応練習へのリンク集（CURRICULUM の `practiceHrefs` を参照。0 件なら節ごと出さない）
 * - 前後章へのリンク
 *
 * @design cookie を読まない
 * ここで `getOptionalUser()` を呼ぶと章ページ全体が動的になり、CDN キャッシュに
 * 乗らず loading.tsx が要る（初期 HTML の本文が Suspense の後ろに回る）。
 * ユーザーに依存するのは読了トグルだけなので、そこだけをクライアントに委ね、
 * 章本文は静的に生成する。
 */
export async function LearnPageLayout({
  slug,
  children,
}: LearnPageLayoutProps) {
  const namespace = chapterNamespace(slug);
  const [t, tLearn, tChapter, tGlossary, tCompany] = await Promise.all([
    getTranslations(namespace),
    getTranslations("learnCurriculum.index"),
    getTranslations("learnCurriculum.chapter"),
    getTranslations("glossary"),
    getTranslations("company"),
  ]);
  const chapter = getChapterBySlug(slug);
  const practiceHrefs = chapter?.practiceHrefs ?? [];

  // 章の本文はすべて辞書にあるため、名前空間ごと走査すれば、その章が
  // リンクしている用語は漏れなく集まる。章側での列挙は要らない。
  const termPreviews = await resolveTermPreviews(
    collectTermSlugsInNamespace(namespace),
  );

  return (
    <ContentContainer
      breadcrumb={[
        { label: tLearn("pageTitle"), href: "/learn" },
        { label: t("pageTitle") },
      ]}
    >
      {chapter && (
        <JsonLd
          data={buildLearnArticleSchema({
            slug,
            headline: t("pageTitle"),
            description: t("pageDescription"),
            publishedAt: chapter.publishedAt,
            operatorName: tCompany("name.value"),
          })}
        />
      )}
      <PageTitle>{t("pageTitle")}</PageTitle>
      {/* 章の鮮度を読者と検索側に示す。Article の datePublished と同じ日付 */}
      {chapter && (
        <p className="text-center text-xs text-surface-500">
          {tChapter("publishedOn", {
            date: formatPublishedDate(chapter.publishedAt),
          })}
        </p>
      )}

      <div className="space-y-10">
        <GlossaryTermModalProvider
          terms={termPreviews}
          viewDetailsLabel={tGlossary("viewDetails")}
          turnOffLabel={tGlossary("turnOffTermLinks")}
          closeLabel={tGlossary("closeLabel")}
        >
          {children}
        </GlossaryTermModalProvider>

        {/* 章を読み終えた位置に置く。練習への CTA より前へは出さない。 */}
        <div className="flex justify-end text-sm">
          <ChapterReadStatus
            slug={slug}
            loginPrompt={<LoginPromptCta slug={slug} />}
          />
        </div>

        {practiceHrefs.length > 0 && (
          <PracticeLinkSection>
            <PracticeLinkList hrefs={practiceHrefs} />
          </PracticeLinkSection>
        )}

        {/* 練習で腕試し → 昇級試験、の順。試験を持つ章（CURRICULUM の examSlug）のみ */}
        {chapter?.examSlug && <ExamCtaCard slug={chapter.examSlug} />}

        <ChapterNav slug={slug} />
      </div>
    </ContentContainer>
  );
}
