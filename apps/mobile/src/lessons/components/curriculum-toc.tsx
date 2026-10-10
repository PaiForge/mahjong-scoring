import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Line } from "react-native-svg";
import { useRouter } from "expo-router";
import { useTranslations } from "use-intl";
import {
  getChapterI18nPath,
  type CurriculumChapter,
  type CurriculumSection,
} from "@mahjong-scoring/features/curriculum/registry";
import { roundedPercent } from "@mahjong-scoring/features/percent";
import { chapterHref } from "@mahjong-scoring/features/routes";

import { Chip } from "../../components/chip";
import { colors, radius } from "../../lib/theme";
import { isLessonPorted } from "../ported-lessons";
import { lessonColors, SECTION_COLORS } from "../lesson-colors";
import { DoneMark } from "./done-mark";

/** セクションの bullet の大きさ（web の `size-4`） */
const BULLET_SIZE = 16;

/** 破線のガイド線の x（bullet の中心） */
const GUIDE_LINE_LEFT = BULLET_SIZE / 2 - 1;

/** 章の行の左の字下げ（web の `pl-7`） */
const CHAPTER_INDENT = 28;

/** セクションの破線のガイド線（iOS は片側の dashed 枠を描けないため svg で引く） */
function GuideLine() {
  return (
    <View pointerEvents="none" style={styles.guideLine}>
      <Svg width={2} height="100%">
        <Line
          x1={1}
          y1={0}
          x2={1}
          y2="100%"
          stroke={colors.surface400}
          strokeWidth={2}
          strokeDasharray="4 3"
        />
      </Svg>
    </View>
  );
}

/** 目次の章 1 行 */
function ChapterRow({
  chapter,
  isDone,
  isNext,
}: {
  readonly chapter: CurriculumChapter;
  readonly isDone: boolean;
  readonly isNext: boolean;
}) {
  const t = useTranslations("learnCurriculum");
  const router = useRouter();
  const path = getChapterI18nPath(chapter);
  const ported = isLessonPorted(chapter.slug);

  const body = (pressed: boolean) => (
    <>
      {isNext && <View pointerEvents="none" style={styles.nextLine} />}
      <View style={styles.rowBody}>
        <Text
          style={[
            styles.title,
            ported ? styles.titleLink : styles.titleDisabled,
            pressed && styles.titlePressed,
          ]}
        >
          {t(`${path}.title`)}
        </Text>
        <Text style={styles.description}>{t(`${path}.description`)}</Text>
      </View>
      {isNext && (
        <View style={styles.badge}>
          <Chip tone="amber">{t("index.nextChapterBadge")}</Chip>
        </View>
      )}
      {isDone && <DoneMark label={t("chapter.completedMark")} />}
      {!ported && (
        <View style={styles.badge}>
          <Chip tone="neutral">{t("index.unavailableBadge")}</Chip>
        </View>
      )}
    </>
  );

  if (!ported) {
    return (
      <View
        style={styles.row}
        accessibilityState={{ disabled: true }}
        testID={`chapter-${chapter.slug}`}
      >
        {body(false)}
      </View>
    );
  }

  return (
    <Pressable
      onPress={() => router.push(chapterHref(chapter.slug))}
      accessibilityRole="link"
      accessibilityState={{ selected: isNext }}
      testID={`chapter-${chapter.slug}`}
      style={[styles.row, isNext && styles.rowNext]}
    >
      {({ pressed }) => body(pressed)}
    </Pressable>
  );
}

/**
 * Zenn 書籍目次風の章リスト（セクション階層版）（web の `CurriculumToc`）
 * 目次
 *
 * bullet 1 つがセクションを表し、章はその右下に字下げしてぶら下がる。
 * 破線のガイド線がセクションの bullet から最後の章までを縦に束ねる。
 * 「次はここから」のバッジと完了の印は行の右端に出す（排他）。
 *
 * モバイルに本文を移植していない章は、目次の並びを崩さないよう行は残し、
 * 押せない形（淡い題名）に「アプリ版は準備中」を添える。
 */
export function CurriculumToc({
  section,
  chapters,
  completedSlugs,
  nextSlug,
}: {
  readonly section: CurriculumSection;
  readonly chapters: readonly CurriculumChapter[];
  /** 完了したレッスン（章） */
  readonly completedSlugs: ReadonlySet<string>;
  readonly nextSlug: string | undefined;
}) {
  const t = useTranslations("learnCurriculum");
  if (chapters.length === 0) return undefined;
  const sectionLabel = t(`sections.${section}`);

  return (
    <View accessibilityLabel={sectionLabel}>
      <GuideLine />
      <View style={styles.sectionHeader}>
        <View
          style={[styles.bullet, { backgroundColor: SECTION_COLORS[section] }]}
        />
        <Text style={styles.sectionLabel}>{sectionLabel}</Text>
      </View>
      <View>
        {chapters.map((chapter) => (
          <ChapterRow
            key={chapter.slug}
            chapter={chapter}
            isDone={completedSlugs.has(chapter.slug)}
            isNext={nextSlug === chapter.slug}
          />
        ))}
      </View>
    </View>
  );
}

/**
 * カリキュラム全体の学習進捗を示すバー（web の `CurriculumProgressBar`）
 * 学習進捗バー
 *
 * @param completedCount 完了したレッスンの数
 * @param totalCount レッスンの総数
 * @param allCompleted すべて完了したか
 */
export function CurriculumProgressBar({
  completedCount,
  totalCount,
  allCompleted,
}: {
  readonly completedCount: number;
  readonly totalCount: number;
  readonly allCompleted: boolean;
}) {
  const t = useTranslations("learnCurriculum.index");
  const percentage = roundedPercent(completedCount, totalCount);
  return (
    <View style={styles.progress}>
      <View style={styles.progressLabels}>
        <Text style={styles.progressLabel}>
          {t("progressLabel", { done: completedCount, total: totalCount })}
        </Text>
        <Text style={styles.progressPercent}>{`${percentage}%`}</Text>
      </View>
      <View
        style={styles.progressTrack}
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: 100, now: percentage }}
      >
        <View
          style={[
            styles.progressFill,
            {
              width: `${percentage}%`,
              backgroundColor: allCompleted
                ? colors.primary500
                : colors.primary400,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  guideLine: {
    position: "absolute",
    left: GUIDE_LINE_LEFT,
    top: BULLET_SIZE / 2,
    bottom: BULLET_SIZE / 2,
    width: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  bullet: {
    width: BULLET_SIZE,
    height: BULLET_SIZE,
    borderRadius: BULLET_SIZE / 2,
    borderWidth: 2,
    borderColor: colors.panel,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.4,
    color: colors.surface900,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 12,
    paddingLeft: CHAPTER_INDENT,
    paddingRight: 8,
  },
  rowNext: {
    backgroundColor: lessonColors.amber50Solid,
  },
  nextLine: {
    position: "absolute",
    left: GUIDE_LINE_LEFT,
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: lessonColors.amber500,
  },
  rowBody: {
    flex: 1,
    minWidth: 0,
    gap: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
  },
  titleLink: {
    color: colors.foreground,
  },
  titleDisabled: {
    color: colors.surface400,
  },
  titlePressed: {
    color: colors.primary700,
  },
  description: {
    fontSize: 12,
    color: colors.surface400,
  },
  badge: {
    marginTop: 2,
  },
  progress: {
    gap: 8,
  },
  progressLabels: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.surface600,
  },
  progressPercent: {
    fontSize: 12,
    fontVariant: ["tabular-nums"],
    color: colors.surface600,
  },
  progressTrack: {
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.surface100,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: radius.full,
  },
});
