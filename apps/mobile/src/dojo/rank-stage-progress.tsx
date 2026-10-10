import { Fragment } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslations } from "use-intl";
import {
  countProgress,
  currentStage,
  type JourneyStage,
  type RankJourney,
} from "@mahjong-scoring/features/journey/journey";
import { LESSONS_PATH, practiceHref } from "@mahjong-scoring/features/routes";

import { ChevronRightIcon } from "../components/icons/icons";
import { colors, radius } from "../lib/theme";
import { beltStyle } from "./belt-style";
import { DoneMark } from "./done-mark";
import { practiceListHrefForRank } from "./dojo-routes";

/** 1 段分の表示 */
interface StageCell {
  readonly stage: JourneyStage;
  readonly value: string;
  readonly done: boolean;
}

/**
 * 段の行き先 — 学ぶはレッスンの目次、練習するはその級で絞った練習一覧、
 * 試験は試験の説明画面（web の `stageHref`。目次の級の位置へのアンカーは
 * モバイルの目次に無いので、目次の先頭へ送る）
 */
function stageHref(stage: JourneyStage, journey: RankJourney): string {
  switch (stage) {
    case "learn":
      return LESSONS_PATH;
    case "practice":
      return practiceListHrefForRank(journey.rank.slug);
    case "exam":
      return practiceHref(journey.exam.slug);
  }
}

/**
 * 級の進み具合（学ぶ → 練習する → 試験）のステップ表示（web の `RankStageProgress`）
 * 段級位の進み具合
 *
 * 段を等幅の列に並べ、列の境目に矢印を置いて順を見せる。いま取り組んで
 * いる段は級の帯色の淡い面で塗り、済んだ段は値を緑の文字にして済みの印を
 * 添え、まだの段はグレーに置く。いま取り組む級（`isCurrentRank`）では各段が
 * その段の一覧へのリンクになる。数えるものがある段だけ並べる（初段は試験だけ）。
 *
 * 試験の値は合格までは「未合格」。ゲストは段級位を持たないので常にこの値。
 */
export function RankStageProgress({
  journey,
  isCurrentRank = false,
}: {
  readonly journey: RankJourney;
  readonly isCurrentRank?: boolean;
}) {
  const t = useTranslations("ranks");
  const router = useRouter();
  const learn = countProgress(journey.chapters);
  const practice = countProgress(journey.practices);
  const current = isCurrentRank ? currentStage(journey) : undefined;
  const belt = beltStyle(journey.rank.slug);

  const cells: StageCell[] = [];
  if (learn.total > 0) {
    cells.push({
      stage: "learn",
      value: t("stageCount", { ...learn }),
      done: learn.done === learn.total,
    });
  }
  if (practice.total > 0) {
    cells.push({
      stage: "practice",
      value: t("stageCount", { ...practice }),
      done: practice.done === practice.total,
    });
  }
  cells.push({
    stage: "exam",
    value: t(journey.exam.done ? "stageExamPassed" : "stageExamNotPassed"),
    done: journey.exam.done,
  });

  return (
    <View style={styles.row}>
      {cells.map((cell, index) => {
        const isCurrent = cell.stage === current;
        const textColor = isCurrent ? belt.tintText : colors.surface600;
        const content = (
          <>
            <Text
              style={[
                styles.name,
                { color: textColor },
                isCurrentRank && styles.linkName,
              ]}
            >
              {t(`stages.${cell.stage}`)}
            </Text>
            <View style={styles.valueRow}>
              {cell.done && <DoneMark size="sm" />}
              <Text
                style={[
                  styles.value,
                  { color: cell.done ? colors.success : textColor },
                ]}
              >
                {cell.value}
              </Text>
            </View>
          </>
        );
        const cellStyle = [
          styles.cell,
          index > 0 && styles.divided,
          isCurrent && { backgroundColor: belt.tint },
        ];
        return (
          <Fragment key={cell.stage}>
            {isCurrentRank ? (
              <Pressable
                accessibilityRole="link"
                accessibilityState={{ selected: isCurrent }}
                onPress={() => router.navigate(stageHref(cell.stage, journey))}
                style={({ pressed }) => [cellStyle, pressed && styles.pressed]}
              >
                {content}
              </Pressable>
            ) : (
              <View style={cellStyle}>{content}</View>
            )}
            {index < cells.length - 1 && (
              <View style={styles.arrowSlot} pointerEvents="none">
                <View style={styles.arrow}>
                  <ChevronRightIcon size={16} color={colors.surface400} />
                </View>
              </View>
            )}
          </Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: colors.panel,
    borderRadius: radius.lg,
    overflow: "hidden",
  },
  cell: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  divided: {
    borderLeftWidth: 1,
    borderLeftColor: colors.panel,
  },
  pressed: {
    opacity: 0.7,
  },
  name: {
    fontSize: 12,
    fontWeight: "700",
  },
  linkName: {
    color: colors.action,
  },
  valueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  value: {
    fontSize: 14,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  // 列の境目に重ねる矢印。幅 0 の枠から左右へはみ出させ、列の幅を変えない
  arrowSlot: {
    width: 0,
    zIndex: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
  },
  arrow: {
    position: "absolute",
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
});
