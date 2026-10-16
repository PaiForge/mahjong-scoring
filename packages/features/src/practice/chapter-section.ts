import type { CurriculumChapterSlug } from "../curriculum/registry";
import {
  practiceMenuBySlug,
  type PracticeMenuSlug,
} from "../practice-menu-types";
import { rankRequiringMenu } from "../ranks/registry";
import { isExamMenu, relatedChaptersForPractice } from "./catalog";

/**
 * 練習・昇級試験の画面に置くレッスンの節の中身
 * 練習のレッスン節
 */
export interface PracticeChapterSectionContent {
  /**
   * 見出しの辞書キー（名前空間込み。名前空間を指定しない翻訳関数で引く）。
   * 練習は「関連するレッスン」、昇級試験は道場と同じ「前提となるレッスン」
   */
  readonly titleKey: "practice.requiredKnowledge" | "dojo.chaptersTitle";
  /** 並べる章（カリキュラムの表示順） */
  readonly slugs: readonly CurriculumChapterSlug[];
}

/**
 * 練習・昇級試験に紐づくレッスンの節の中身を決める。章が無ければ undefined
 * 練習のレッスン節決定
 *
 * 練習と昇級試験で見出しも中身の出どころも変わる。説明画面と結果画面、web と
 * アプリで同じ集合・同じ見出しを出すため、決め方をここに 1 つだけ置く。
 *
 * - 通常の練習は「関連するレッスン」。読んでおくと解きやすいという程度の
 *   関係で、{@link relatedChaptersForPractice} がカタログの `learnChapter` と
 *   「その練習へ送っている章」（章の `practiceLinks` の逆引き）を畳んで返す。
 *   章から練習へ来た人が同じ章へ戻れるのはこの逆引きの側で、点数表早引きの
 *   ように複数の章が送る練習では 1 件にならない
 * - 昇級試験は「前提となるレッスン」。合格に必要な知識の全体なので、
 *   段級位レジストリがそのランクに宣言した章をすべて出す（1 章ではない）。
 *   道場が出す前提章と同じ集合・同じ見出しで、出どころも同じレジストリ
 *
 * どちらも持たない練習では節ごと出さない（undefined を返す）。
 *
 * @param slug - 練習スラッグ（昇級試験を含む）
 */
export function practiceChapterSection(
  slug: PracticeMenuSlug,
): PracticeChapterSectionContent | undefined {
  const examRank = isExamMenu(slug)
    ? rankRequiringMenu(practiceMenuBySlug(slug).menuType)?.rank
    : undefined;
  const content: PracticeChapterSectionContent = examRank
    ? { titleKey: "dojo.chaptersTitle", slugs: examRank.learnChapterSlugs }
    : {
        titleKey: "practice.requiredKnowledge",
        slugs: relatedChaptersForPractice(slug),
      };
  return content.slugs.length === 0 ? undefined : content;
}
