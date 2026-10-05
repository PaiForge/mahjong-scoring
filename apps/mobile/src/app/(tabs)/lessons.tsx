import { StyleSheet, Text, View } from "react-native";
import { useTranslations } from "use-intl";
import {
  CURRICULUM,
  CURRICULUM_SECTIONS,
  chaptersBySection,
  pickNextChapter,
} from "@mahjong-scoring/features/curriculum/registry";

import { Screen } from "../../components/screen";
import { SectionTitle } from "../../components/section-title";
import { useCompletedLessonSlugs } from "../../hooks/use-lesson-completion-store";
import { colors } from "../../lib/theme";
import {
  CurriculumProgressBar,
  CurriculumToc,
} from "../../lessons/components/curriculum-toc";
import { isLessonPorted } from "../../lessons/ported-lessons";

/** モバイルで開けるレッスン（目次の順） */
const PORTED_CHAPTERS = CURRICULUM.filter((chapter) =>
  isLessonPorted(chapter.slug),
);

/** モバイルで開けないレッスン（「次はここから」の候補から外す） */
const UNPORTED_SLUGS = CURRICULUM.filter(
  (chapter) => !isLessonPorted(chapter.slug),
).map((chapter) => chapter.slug);

/** セクション別の章（並びは変わらないので 1 回だけ組む） */
const GROUPED = chaptersBySection();

/**
 * レッスン（目次）
 *
 * @description
 * セクション（基礎 / 満貫 / 役 / 符 / 点数計算 / 記憶術）ごとにレッスン（章）を
 * 並べ、完了の印・進捗率・「次はここから」を出す（web の `/lessons`）。完了は
 * 端末に記録したもの。モバイルに本文を移植していないレッスンも並びに残すが
 * 開けず、進捗の分母と「次はここから」の候補から外す。
 *
 * @flow
 * レッスンの行を押すと `/lessons/<slug>` を開く。
 */
export default function LessonsTab() {
  const t = useTranslations("learnCurriculum.index");
  const completedSlugs = useCompletedLessonSlugs();
  const next = pickNextChapter(new Set([...completedSlugs, ...UNPORTED_SLUGS]));
  const completedCount = PORTED_CHAPTERS.filter((chapter) =>
    completedSlugs.has(chapter.slug),
  ).length;
  const allCompleted = next === undefined;

  return (
    <Screen title={t("pageTitle")}>
      <View style={styles.page}>
        <View style={styles.intro}>
          <SectionTitle>{t("sectionTitle")}</SectionTitle>
          <Text style={styles.description}>{t("pageDescription")}</Text>
        </View>

        <CurriculumProgressBar
          completedCount={completedCount}
          totalCount={PORTED_CHAPTERS.length}
          allCompleted={allCompleted}
        />

        {CURRICULUM_SECTIONS.map((section) => (
          <CurriculumToc
            key={section}
            section={section}
            chapters={GROUPED.get(section) ?? []}
            completedSlugs={completedSlugs}
            nextSlug={next?.slug}
          />
        ))}

        {allCompleted && (
          <Text style={styles.allCompleted}>{t("allCompletedMessage")}</Text>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: {
    gap: 32,
  },
  intro: {
    gap: 12,
  },
  description: {
    fontSize: 14,
    color: colors.surface500,
  },
  allCompleted: {
    fontSize: 14,
    textAlign: "center",
    color: colors.surface600,
  },
});
