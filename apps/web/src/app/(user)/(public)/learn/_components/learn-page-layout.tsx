import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { ContentContainer } from "@/app/_components/content-container";
import { PageTitle } from "@/app/_components/page-title";
import { getOptionalUser } from "@/lib/auth";
import {
  CURRICULUM,
  type CurriculumChapterSlug,
} from "../_lib/curriculum";
import { isChapterRead } from "../_lib/progress";
import { ChapterNav } from "./chapter-nav";
import { LoginPromptCta } from "./login-prompt-cta";
import { MarkAsReadButton } from "./mark-as-read-button";
import { PracticeLinkList } from "./practice-link-card";

interface LearnPageLayoutProps {
  /** 対象章のスラッグ */
  readonly slug: CurriculumChapterSlug;
  /** ページタイトル等の i18n ネームスペース（例: "jantouFu.learn"） */
  readonly namespace: string;
  /** ガイドコンテンツ */
  readonly children: ReactNode;
}

/**
 * 学習章ページの共通レイアウト
 * 学習章レイアウト
 *
 * 章本文の前後に以下を描画する:
 * - ページタイトル（`{namespace}.pageTitle`）
 * - 章本文（children）
 * - 対応練習へのリンク集（CURRICULUM の `practiceHrefs` を参照）
 * - 読了トグル（認証時）/ ログイン導線（未認証時）
 * - 前後章へのリンク
 */
export async function LearnPageLayout({
  slug,
  namespace,
  children,
}: LearnPageLayoutProps) {
  const t = await getTranslations(namespace);
  const chapter = CURRICULUM.find((c) => c.slug === slug);
  const practiceHrefs = chapter?.practiceHrefs ?? [];

  const [user, alreadyRead] = await Promise.all([
    getOptionalUser(),
    isChapterRead(slug),
  ]);

  return (
    <ContentContainer>
      <PageTitle>{t("pageTitle")}</PageTitle>

      <div className="mt-6">{children}</div>

      <PracticeLinkList hrefs={practiceHrefs} />

      <div className="mt-10 flex justify-center">
        {user ? (
          <MarkAsReadButton slug={slug} initialRead={alreadyRead} />
        ) : (
          <LoginPromptCta slug={slug} />
        )}
      </div>

      <ChapterNav slug={slug} />
    </ContentContainer>
  );
}
