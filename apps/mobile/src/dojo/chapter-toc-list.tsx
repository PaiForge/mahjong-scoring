import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslations } from "use-intl";
import {
  CURRICULUM_SECTIONS,
  getChapterBySlug,
  getChapterI18nPath,
  type CurriculumChapterSlug,
} from "@mahjong-scoring/features/curriculum/registry";
import { chapterHref, LESSONS_PATH } from "@mahjong-scoring/features/routes";

import { DashedDivider } from "../components/dashed-divider";
import { ChevronRightIcon } from "../components/icons/icons";
import { TextLink } from "../components/text-link";
import { SECTION_COLORS } from "../lessons/lesson-colors";
import { colors } from "../lib/theme";
import { DoneMark } from "./done-mark";

/**
 * 章スラッグの並びをセクションごとの目次として描く（web の `ChapterTocList`）
 * 章目次リスト
 *
 * カリキュラム全体ではなく「選んだ章だけ」を目次の書式で見せる（昇級試験の
 * 説明・級の詳細の前提のレッスン）。セクション見出し（色の丸 + 名前）の下に
 * 章の題名（リンク）と説明を並べ、完了したレッスンには済みの印を添える。
 * 「次はここから」の印は出さない（進む順の案内はレッスンの目次の役割）。
 *
 * web の目次は丸を縦の破線でつなぐが、ここでは章の間を破線で区切るだけにする。
 */
export function ChapterTocList({
  slugs,
  completedSlugs,
}: {
  /** 表示する章（カリキュラムの表示順で渡す） */
  readonly slugs: readonly CurriculumChapterSlug[];
  /** 完了したレッスン（章）。完了の印を出さない場面では空集合を渡す */
  readonly completedSlugs: ReadonlySet<string>;
}) {
  const t = useTranslations("learnCurriculum");
  const router = useRouter();
  const chapters = slugs
    .map(getChapterBySlug)
    .filter((chapter) => chapter !== undefined);

  return (
    <View style={styles.root}>
      {CURRICULUM_SECTIONS.map((section) => {
        const sectionChapters = chapters.filter(
          (chapter) => chapter.section === section,
        );
        if (sectionChapters.length === 0) return undefined;
        return (
          <View key={section}>
            <View style={styles.sectionRow}>
              <View
                style={[
                  styles.bullet,
                  { backgroundColor: SECTION_COLORS[section] },
                ]}
              />
              <Text accessibilityRole="header" style={styles.sectionLabel}>
                {t(`sections.${section}`)}
              </Text>
            </View>
            <View style={styles.chapters}>
              {sectionChapters.map((chapter, index) => {
                const path = getChapterI18nPath(chapter);
                return (
                  <View key={chapter.slug}>
                    {index > 0 && <DashedDivider />}
                    <Pressable
                      accessibilityRole="link"
                      onPress={() => router.push(chapterHref(chapter.slug))}
                      style={({ pressed }) => [
                        styles.chapterRow,
                        pressed && styles.pressed,
                      ]}
                    >
                      <View style={styles.chapterBody}>
                        <Text style={styles.chapterTitle}>
                          {t(`${path}.title`)}
                        </Text>
                        <Text style={styles.chapterDescription}>
                          {t(`${path}.description`)}
                        </Text>
                      </View>
                      {completedSlugs.has(chapter.slug) && (
                        <DoneMark label={t("chapter.completedMark")} />
                      )}
                      <View style={styles.chevron}>
                        <ChevronRightIcon size={18} color={colors.surface400} />
                      </View>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          </View>
        );
      })}
    </View>
  );
}

/**
 * レッスンの目次への導線（web の `CurriculumTocLink`）
 * 目次リンク
 *
 * 章を抜粋して見せたセクションの末尾に、右端揃えのテキストリンクで置く。
 */
export function CurriculumTocLink() {
  const t = useTranslations("learnCurriculum");
  const router = useRouter();
  return (
    <View style={styles.tocLink}>
      <TextLink onPress={() => router.navigate(LESSONS_PATH)}>
        {t("tocLink")}
      </TextLink>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: 24,
  },
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  bullet: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.ink,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.3,
    color: colors.surface900,
  },
  chapters: {
    marginLeft: 7,
    paddingLeft: 17,
    borderLeftWidth: 2,
    borderLeftColor: colors.surface300,
  },
  chapterRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 12,
  },
  pressed: {
    opacity: 0.6,
  },
  chevron: {
    minHeight: 20,
    justifyContent: "center",
  },
  chapterBody: {
    flex: 1,
    minWidth: 0,
    gap: 8,
  },
  chapterTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.foreground,
  },
  chapterDescription: {
    fontSize: 12,
    color: colors.surface400,
  },
  tocLink: {
    alignItems: "flex-end",
  },
});
