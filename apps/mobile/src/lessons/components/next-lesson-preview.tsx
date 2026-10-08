import { StyleSheet, Text } from "react-native";
import { useRouter } from "expo-router";
import { useTranslations } from "use-intl";
import {
  getAdjacentChapters,
  getChapterBySlug,
  getChapterI18nPath,
  type CurriculumChapterSlug,
} from "@mahjong-scoring/features/curriculum/registry";
import { lessonExcerpt } from "@mahjong-scoring/features/lessons/excerpt";
import { isQuizLessonSlug } from "@mahjong-scoring/features/lessons/registry";
import { chapterHref } from "@mahjong-scoring/features/routes";

import { TextLink } from "../../components/text-link";
import { colors } from "../../lib/theme";
import { isLessonPorted } from "../ported-lessons";
import { FollowUpPanel } from "./follow-up-panel";

/** 抜粋を見せる行数。続きがあることは末尾の省略で示す */
const EXCERPT_LINES = 3;

/**
 * 完了画面の「次のレッスン」— 次のレッスンの冒頭を見せて続きへ送る（web の `NextLessonPreview`）
 * 次のレッスンのプレビュー
 *
 * 確認問題を持つレッスンの完了画面で、黒帯への道でこのレッスンの次がレッスンの
 * ときに主導線のボタンの代わりに出す。確認問題を持たない章では、完了にした後に
 * 目次の順の次のレッスン（{@link nextChapterSlug}）を指して出す — 完了で
 * 学習が途切れないように。
 *
 * 行き先の名前だけのボタンより、実際の書き出しを 3 行ほど読ませた方が
 * 「続きを読みたい」で次へ進める。抜粋を持つのは確認問題を持つレッスンだけで、
 * それ以外は題名だけを出す。web は下端を地の色へ溶かして切るが、ネイティブ
 * では文字の省略（…）で続きがあることを示す。
 *
 * 次のレッスンへは `replace` で移る。続けて読むたびにスタックを積むと、
 * ヘッダーの戻るを読んだ章の数だけ押さないと、学習を始めた画面（目次・
 * 道場・練習）へ帰れない。
 */
export function NextLessonPreview({
  slug,
}: {
  readonly slug: CurriculumChapterSlug;
}) {
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
      {isQuizLessonSlug(slug) && (
        <Text
          style={styles.excerpt}
          numberOfLines={EXCERPT_LINES}
          ellipsizeMode="tail"
        >
          {lessonExcerpt(slug, (key) => tAll(key)).join("\n")}
        </Text>
      )}
      <TextLink onPress={() => router.replace(chapterHref(slug))}>
        {t("readMore")}
      </TextLink>
    </FollowUpPanel>
  );
}

/**
 * 目次の順で次の、モバイルで開けるレッスン。最後の章なら `undefined`
 *
 * @param slug 現在の章
 */
export function nextChapterSlug(
  slug: CurriculumChapterSlug,
): CurriculumChapterSlug | undefined {
  const { next } = getAdjacentChapters(slug);
  return next !== undefined && isLessonPorted(next.slug)
    ? next.slug
    : undefined;
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
