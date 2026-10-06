import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslations } from "use-intl";
import {
  getAdjacentChapters,
  getChapterBySlug,
  getChapterI18nPath,
  type CurriculumChapter,
  type CurriculumChapterSlug,
} from "@mahjong-scoring/features/curriculum/registry";
import { formatPublishedDate } from "@mahjong-scoring/features/curriculum/published-date";
import { chapterHref } from "@mahjong-scoring/features/routes";

import { DashedDivider } from "../../components/dashed-divider";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
} from "../../components/icons/icons";
import { colors } from "../../lib/theme";
import { isLessonPorted } from "../ported-lessons";

/**
 * 章の前後のリンク 1 つ
 *
 * 前後の章へは `replace` で移る（読み進めるたびにスタックを積むと、戻るで
 * 目次に帰れなくなる）。
 */
function ChapterNavLink({
  chapter,
  direction,
}: {
  readonly chapter: CurriculumChapter;
  readonly direction: "prev" | "next";
}) {
  const t = useTranslations("learnCurriculum");
  const router = useRouter();
  const isNext = direction === "next";
  const icon = isNext ? (
    <ChevronRightIcon size={16} color={colors.mutedForeground} />
  ) : (
    <ChevronLeftIcon size={16} color={colors.mutedForeground} />
  );
  return (
    <Pressable
      onPress={() => router.replace(chapterHref(chapter.slug))}
      accessibilityRole="link"
      accessibilityLabel={`${t(isNext ? "chapter.nextChapterLabel" : "chapter.prevChapterLabel")} ${t(`${getChapterI18nPath(chapter)}.title`)}`}
      hitSlop={8}
      style={[styles.link, isNext && styles.next]}
    >
      {({ pressed }) => (
        <>
          {!isNext && icon}
          <Text
            numberOfLines={1}
            style={[styles.title, pressed && styles.pressed]}
          >
            {t(`${getChapterI18nPath(chapter)}.title`)}
          </Text>
          {isNext && icon}
        </>
      )}
    </Pressable>
  );
}

/**
 * 章ページの前後リンク（web の `ChapterNav`）
 * 章ナビゲーション
 *
 * 前後の章を 1 行のテキストリンクで左右に出す。モバイルに未移植の章は
 * 開けないので、前後のうち移植済みの章だけを指す。
 *
 * @param slug 現在の章
 */
export function ChapterNav({ slug }: { readonly slug: CurriculumChapterSlug }) {
  const t = useTranslations("learnCurriculum.chapter");
  const { prev, next } = getAdjacentChapters(slug);
  const prevPorted = prev && isLessonPorted(prev.slug) ? prev : undefined;
  const nextPorted = next && isLessonPorted(next.slug) ? next : undefined;
  const chapter = getChapterBySlug(slug);

  return (
    <View style={styles.footer}>
      {(prevPorted || nextPorted) && (
        <>
          <DashedDivider />
          <View accessibilityLabel={t("chapterNavLabel")} style={styles.nav}>
            {prevPorted && (
              <ChapterNavLink chapter={prevPorted} direction="prev" />
            )}
            {nextPorted && (
              <ChapterNavLink chapter={nextPorted} direction="next" />
            )}
          </View>
        </>
      )}
      {chapter && (
        <Text style={styles.published}>
          {t("publishedOn", {
            date: formatPublishedDate(chapter.publishedAt),
          })}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    gap: 24,
  },
  nav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  link: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexShrink: 1,
    minWidth: 0,
  },
  next: {
    marginLeft: "auto",
  },
  title: {
    flexShrink: 1,
    fontSize: 15,
    fontWeight: "600",
    color: colors.primary700,
  },
  pressed: {
    color: colors.primary900,
    opacity: 0.7,
  },
  published: {
    fontSize: 12,
    color: colors.surface500,
  },
});
