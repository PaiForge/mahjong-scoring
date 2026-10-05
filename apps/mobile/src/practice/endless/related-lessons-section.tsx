import { StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslations } from "use-intl";
import {
  chaptersInSection,
  getChapterBySlug,
  getChapterI18nPath,
  type CurriculumSection,
} from "@mahjong-scoring/features/curriculum/registry";
import { chapterHref } from "@mahjong-scoring/features/routes";

import { LinkRow, LinkRowList } from "../../components/link-row";
import { SectionTitle } from "../../components/section-title";

/**
 * 練習の設定画面に置く関連レッスンの一覧（web の `PracticeChapterSection`）
 * 練習のレッスンセクション
 *
 * 章のタイトル・説明はカリキュラムの文言をそのまま使う。レッスンへは読みに
 * 行くだけなので、押して始める面（太枠・影）にはせず {@link LinkRow} で並べる。
 * 完了の印は出さない（web と同じく、完了の進捗はレッスン一覧が見せる）。
 */
export function RelatedLessonsSection({
  section,
}: {
  /** 並べる章のセクション（カリキュラムの表示順で並ぶ） */
  readonly section: CurriculumSection;
}) {
  const tp = useTranslations("practice");
  const tc = useTranslations("learnCurriculum");
  const router = useRouter();
  const slugs = chaptersInSection(section);

  if (slugs.length === 0) return undefined;

  return (
    <View style={styles.section}>
      <SectionTitle>{tp("requiredKnowledge")}</SectionTitle>
      <LinkRowList>
        {slugs.map((slug) => {
          const chapter = getChapterBySlug(slug);
          if (chapter === undefined) return undefined;
          const path = getChapterI18nPath(chapter);
          return (
            <LinkRow
              key={slug}
              onPress={() => router.push(chapterHref(slug))}
              title={tc(`${path}.title`)}
              description={tc(`${path}.description`)}
            />
          );
        })}
      </LinkRowList>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 12,
  },
});
