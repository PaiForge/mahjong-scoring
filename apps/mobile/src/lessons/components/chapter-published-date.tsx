import { StyleSheet, Text } from "react-native";
import { useTranslations } from "use-intl";
import {
  getChapterBySlug,
  type CurriculumChapterSlug,
} from "@mahjong-scoring/features/curriculum/registry";
import { formatPublishedDate } from "@mahjong-scoring/features/curriculum/published-date";

import { colors } from "../../lib/theme";

/**
 * 章末の公開日（web の `LearnPageLayout` の末尾）
 * 章公開日
 *
 * web は公開日の上に前後の章へのリンクを置くが、モバイルには置かない。
 * 読み終えてから進む先は完了の後の「次のレッスン」（{@link
 * import("./next-lesson-preview").NextLessonPreview}）が受け持つ。常設の
 * 左右のリンクは完了を経ずに読み飛ばす道になり、ネイティブでは横並びの
 * 小さな文字の操作として押しにくいため。
 *
 * @param slug 現在の章
 */
export function ChapterPublishedDate({
  slug,
}: {
  readonly slug: CurriculumChapterSlug;
}) {
  const t = useTranslations("learnCurriculum.chapter");
  const chapter = getChapterBySlug(slug);
  if (chapter === undefined) return undefined;

  return (
    <Text style={styles.published}>
      {t("publishedOn", { date: formatPublishedDate(chapter.publishedAt) })}
    </Text>
  );
}

const styles = StyleSheet.create({
  published: {
    fontSize: 12,
    color: colors.surface500,
  },
});
