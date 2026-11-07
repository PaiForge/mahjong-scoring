import { getTranslations } from "next-intl/server";
import { PracticeChapterSection } from "./practice-chapter-section";
import { practiceChapterSection } from "@mahjong-scoring/features/practice/chapter-section";
import type { PracticeMenuSlug } from "@mahjong-scoring/features/practice-menu-types";

interface PracticeRelatedChaptersProps {
  /** 練習スラッグ（昇級試験を含む） */
  readonly slug: PracticeMenuSlug;
}

/**
 * 練習・昇級試験に紐づくレッスンのセクション
 * 練習関連レッスン
 *
 * @remarks
 * 説明ページと結果ページの両方に置く。見出しと章の集合の決め方（練習は
 * 「関連するレッスン」、昇級試験は道場と同じ「前提となるレッスン」）は
 * アプリと共有する `practiceChapterSection()` が持つ。どちらも持たない練習では
 * セクションごと出さない。
 */
export async function PracticeRelatedChapters({
  slug,
}: PracticeRelatedChaptersProps) {
  const content = practiceChapterSection(slug);
  if (content === undefined) return undefined;

  const t = await getTranslations();
  return (
    <PracticeChapterSection title={t(content.titleKey)} slugs={content.slugs} />
  );
}
