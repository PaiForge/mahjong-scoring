import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { ContentContainer } from "@/app/(user)/_components/content-container";
import { GlossaryTermModalProvider } from "@/app/(user)/_components/glossary/glossary-term-modal-provider";
import { PageTitle } from "@/app/(user)/_components/page-title";
import { getOptionalUser } from "@/lib/auth";
import { collectTermSlugsInNamespace } from "@/lib/glossary/message-terms";
import { resolveTermPreviews } from "@/lib/glossary/queries";
import {
  getChapterBySlug,
  type CurriculumChapterSlug,
} from "../_lib/curriculum";
import { chapterNamespace } from "../_lib/metadata";
import { isChapterRead } from "../_lib/progress";
import { ChapterNav } from "./chapter-nav";
import { ExamCtaCard } from "./exam-cta-card";
import { LoginPromptCta } from "./login-prompt-cta";
import { MarkAsReadButton } from "./mark-as-read-button";
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
 * - 読了トグル（認証時）/ ログイン導線（未認証時）
 * - 対応練習へのリンク集（CURRICULUM の `practiceHrefs` を参照。0 件なら節ごと出さない）
 * - 前後章へのリンク
 */
export async function LearnPageLayout({
  slug,
  children,
}: LearnPageLayoutProps) {
  const namespace = chapterNamespace(slug);
  const [t, tLearn, tGlossary] = await Promise.all([
    getTranslations(namespace),
    getTranslations("learnCurriculum.index"),
    getTranslations("glossary"),
  ]);
  const chapter = getChapterBySlug(slug);
  const practiceHrefs = chapter?.practiceHrefs ?? [];

  const [user, alreadyRead, termPreviews] = await Promise.all([
    getOptionalUser(),
    isChapterRead(slug),
    // 章の本文はすべて辞書にあるため、名前空間ごと走査すれば、その章が
    // リンクしている用語は漏れなく集まる。章側での列挙は要らない。
    resolveTermPreviews(collectTermSlugsInNamespace(namespace)),
  ]);

  return (
    <ContentContainer
      breadcrumb={[
        { label: tLearn("pageTitle"), href: "/learn" },
        { label: t("pageTitle") },
      ]}
    >
      <PageTitle>{t("pageTitle")}</PageTitle>

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
        <div className="flex justify-end">
          {user ? (
            <MarkAsReadButton slug={slug} initialRead={alreadyRead} />
          ) : (
            <LoginPromptCta slug={slug} />
          )}
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
