import { StyleSheet, Text } from "react-native";
import { useRouter } from "expo-router";
import { useTranslations } from "use-intl";
import {
  getChapterBySlug,
  getChapterI18nPath,
} from "@mahjong-scoring/features/curriculum/registry";
import { lessonExcerpt } from "@mahjong-scoring/features/lessons/excerpt";
import type { QuizLessonSlug } from "@mahjong-scoring/features/lessons/registry";
import { chapterHref } from "@mahjong-scoring/features/routes";

import { TextLink } from "../../components/text-link";
import { colors } from "../../lib/theme";
import { FollowUpPanel } from "./follow-up-panel";

/** 抜粋を見せる行数。続きがあることは末尾の省略で示す */
const EXCERPT_LINES = 3;

/**
 * 完了画面の「次のレッスン」— 次のレッスンの冒頭を見せて続きへ送る（web の `NextLessonPreview`）
 * 次のレッスンのプレビュー
 *
 * 黒帯への道でこのレッスンの次がレッスンのときに、主導線のボタンの代わりに
 * 出す。行き先の名前だけのボタンより、実際の書き出しを 3 行ほど読ませた方が
 * 「続きを読みたい」で次へ進める。web は下端を地の色へ溶かして切るが、
 * ネイティブでは文字の省略（…）で続きがあることを示す。
 */
export function NextLessonPreview({ slug }: { readonly slug: QuizLessonSlug }) {
  const t = useTranslations("lessons.nextLesson");
  const tCurriculum = useTranslations("learnCurriculum");
  const tAll = useTranslations();
  const router = useRouter();
  const chapter = getChapterBySlug(slug);
  if (chapter === undefined) return undefined;

  return (
    <FollowUpPanel title={t("title")} testID="next-lesson-preview">
      <Text style={styles.lessonTitle}>
        {tCurriculum(`${getChapterI18nPath(chapter)}.title`)}
      </Text>
      <Text
        style={styles.excerpt}
        numberOfLines={EXCERPT_LINES}
        ellipsizeMode="tail"
      >
        {lessonExcerpt(slug, (key) => tAll(key)).join("\n")}
      </Text>
      <TextLink onPress={() => router.push(chapterHref(slug))}>
        {t("readMore")}
      </TextLink>
    </FollowUpPanel>
  );
}

const styles = StyleSheet.create({
  lessonTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.surface900,
  },
  excerpt: {
    fontSize: 15,
    lineHeight: 24,
    color: colors.surface700,
  },
});
