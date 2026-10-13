import { getTranslations } from "next-intl/server";
import { PracticeChapterSection } from "./practice-chapter-section";
import {
  isExamMenu,
  relatedChaptersForPractice,
} from "@mahjong-scoring/features/practice/catalog";
import type { CurriculumChapterSlug } from "@mahjong-scoring/features/curriculum/registry";
import {
  practiceMenuBySlug,
  type PracticeMenuSlug,
} from "@mahjong-scoring/features/practice-menu-types";
import { rankRequiringMenu } from "@mahjong-scoring/features/ranks/registry";

interface PracticeRelatedChaptersProps {
  /** 練習スラッグ（昇級試験を含む） */
  readonly slug: PracticeMenuSlug;
}

/**
 * 練習・昇級試験に紐づくレッスンのセクション
 * 練習関連レッスン
 *
 * @remarks
 * 練習と昇級試験で見出しも中身の出どころも変わる。説明ページと結果ページで
 * 同じ集合・同じ見出しを出すため、決め方をここに 1 つだけ置く。
 *
 * - 通常の練習は「関連するレッスン」。読んでおくと解きやすいという程度の
 *   関係で、`relatedChaptersForPractice()` がカタログの `learnChapter` と
 *   「その練習へ送っている章」（章の `practiceLinks` の逆引き）を畳んで返す。
 *   章から練習へ来た人が同じ章へ戻れるのはこの逆引きの側で、点数表早引きの
 *   ように複数の章が送る練習では 1 件にならない
 * - 昇級試験は「前提となるレッスン」。合格に必要な知識の全体なので、
 *   段級位レジストリがそのランクに宣言した章をすべて出す（1 章ではない）。
 *   道場が出す前提章と同じ集合・同じ見出しで、出どころも同じレジストリ
 *
 * どちらも持たない練習ではセクションごと出さない。
 */
export async function PracticeRelatedChapters({
  slug,
}: PracticeRelatedChaptersProps) {
  const examRank = isExamMenu(slug)
    ? rankRequiringMenu(practiceMenuBySlug(slug).menuType)?.rank
    : undefined;
  const chapterSlugs: readonly CurriculumChapterSlug[] = examRank
    ? examRank.learnChapterSlugs
    : relatedChaptersForPractice(slug);
  if (chapterSlugs.length === 0) return undefined;

  // 見出しは道場と同じ文言を引く（同じ集合を別の名前で呼ばないため）
  const title = examRank
    ? (await getTranslations("dojo"))("chaptersTitle")
    : (await getTranslations("practice"))("requiredKnowledge");

  return <PracticeChapterSection title={title} slugs={chapterSlugs} />;
}
