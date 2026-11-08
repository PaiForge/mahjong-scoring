import { StyleSheet, Text } from "react-native";
import { useTranslations } from "use-intl";
import {
  chapterPublishedAtFor,
  getChapterBySlug,
  type CurriculumChapterSlug,
} from "@mahjong-scoring/features/curriculum/registry";
import { formatPublishedDate } from "@mahjong-scoring/features/curriculum/published-date";

import { colors } from "../../lib/theme";
import { useAppLocale } from "../../lib/use-app-locale";

/**
 * 章末の公開日（web の `LearnPageLayout` の末尾）
 * 章公開日
 *
 * web は公開日の上に前後の章へのリンクを置く。モバイルはその位置に
 * 前のレッスンだけを行の形で置く（{@link
 * import("./prev-lesson-link").PrevLessonLink}。前だけにする理由もそこ）。
 *
 * 公開日はアプリの言語のページの公開日だけを、その言語の書式で出す（web と同じ
 * `chapterPublishedAtFor`）。日本語は章の `publishedAt`、英語は翻訳の公開日
 * `translatedAt.en`。英語の公開日が記録されていない章では公開日の行を出さない —
 * 日本語の公開日で代用すると、実際と違う公開日を名乗ることになる。
 *
 * @param slug 現在の章
 */
export function ChapterPublishedDate({
  slug,
}: {
  readonly slug: CurriculumChapterSlug;
}) {
  const t = useTranslations("learnCurriculum.chapter");
  const locale = useAppLocale();
  const chapter = getChapterBySlug(slug);
  if (chapter === undefined) return undefined;
  const publishedAt = chapterPublishedAtFor(chapter, locale);
  if (publishedAt === undefined) return undefined;

  return (
    <Text style={styles.published}>
      {t("publishedOn", { date: formatPublishedDate(publishedAt, locale) })}
    </Text>
  );
}

const styles = StyleSheet.create({
  published: {
    fontSize: 12,
    color: colors.surface500,
  },
});
