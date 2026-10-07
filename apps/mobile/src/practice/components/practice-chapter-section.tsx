import { StyleSheet, View } from "react-native";
import type { CurriculumChapterSlug } from "@mahjong-scoring/features/curriculum/registry";

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
}: {
  readonly title: string;
  /** 並べる章（カリキュラムの表示順で渡す） */
  readonly slugs: readonly CurriculumChapterSlug[];
}) {
  if (slugs.length === 0) return undefined;
  return (
    <View style={styles.section}>
      <SectionTitle>{title}</SectionTitle>
      <ChapterTocList slugs={slugs} completedSlugs={NO_COMPLETED_SLUGS} />
      <CurriculumTocLink />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 12,
  },
});
