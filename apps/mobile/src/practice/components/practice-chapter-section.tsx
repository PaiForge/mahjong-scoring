import { StyleSheet, View } from "react-native";
import { useTranslations } from "use-intl";
import type { CurriculumChapterSlug } from "@mahjong-scoring/features/curriculum/registry";
import { practiceChapterSection } from "@mahjong-scoring/features/practice/chapter-section";
import type { PracticeMenuSlug } from "@mahjong-scoring/features/practice-menu-types";

import { SectionTitle } from "../../components/section-title";
import { ChapterTocList, CurriculumTocLink } from "../../dojo/chapter-toc-list";

/** 練習側の章の並びには完了の印を出さない（完了の進捗はレッスン一覧が見せる） */
const NO_COMPLETED_SLUGS: ReadonlySet<string> = new Set();

/**
 * 練習・試験の説明画面に置くレッスン（章）の節（web の `PracticeChapterSection`）
 * 練習のレッスンセクション
 *
 * 見た目は目次（{@link ChapterTocList}）をそのまま使い、レッスン一覧と同じ書式に
 * そろえる。見出しと章の集合は呼び出し側が決める（練習なら「関連するレッスン」、
 * 試験なら「前提となるレッスン」）。章が 0 件なら節ごと出さない。
 */
export function PracticeChapterSection({
  title,
  slugs,
  tocLinkAlign,
}: {
  readonly title: string;
  /** 「目次へ」を寄せる側（{@link CurriculumTocLink}）。既定は右端 */
  readonly tocLinkAlign?: "end" | "center";
  /** 並べる章（カリキュラムの表示順で渡す） */
  readonly slugs: readonly CurriculumChapterSlug[];
}) {
  if (slugs.length === 0) return undefined;
  return (
    <View style={styles.section}>
      <SectionTitle>{title}</SectionTitle>
      <ChapterTocList slugs={slugs} completedSlugs={NO_COMPLETED_SLUGS} />
      <CurriculumTocLink align={tocLinkAlign} />
    </View>
  );
}

/**
 * 練習・昇級試験に紐づくレッスンの節（web の `PracticeRelatedChapters`）
 * 練習関連レッスン
 *
 * 説明画面と結果画面の両方に置く。見出しと章の集合は web と共有する
 * `practiceChapterSection()` が決める（練習は「関連するレッスン」、昇級試験は
 * 道場と同じ「前提となるレッスン」）。どちらも持たない練習では節ごと出さない。
 */
export function PracticeRelatedChapters({
  slug,
}: {
  readonly slug: PracticeMenuSlug;
}) {
  const t = useTranslations();
  const content = practiceChapterSection(slug);
  if (content === undefined) return undefined;
  return (
    <PracticeChapterSection title={t(content.titleKey)} slugs={content.slugs} />
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 12,
  },
});
