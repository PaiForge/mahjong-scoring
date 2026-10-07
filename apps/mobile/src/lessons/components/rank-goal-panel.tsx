import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslations } from "use-intl";
import { journeyStepTitle } from "@mahjong-scoring/features/journey/journey-step";
import type { RankProgress } from "@mahjong-scoring/features/lessons/follow-up";
import type { PracticeMenuSlug } from "@mahjong-scoring/features/practice-menu-types";
import type { RankSlug } from "@mahjong-scoring/features/ranks/registry";
import {
  DOJO_PATH,
  practiceHref,
  practiceTrainingHref,
} from "@mahjong-scoring/features/routes";

import { LinkRow, LinkRowList } from "../../components/link-row";
import { TextLink } from "../../components/text-link";
import { colors } from "../../lib/theme";
import { FollowUpPanel } from "./follow-up-panel";

/**
 * 級の最後のレッスンの完了画面の「昇級試験まで」（web の `RankGoalPanel`）
 * 昇級試験までのパネル
 *
 * 後ろにレッスンが無いレッスン（5級なら役）では「次のレッスン」を出せないので、
 * 代わりに級のゴールまでの残りを見せる。主導線（次の一歩のボタン）はこの
 * パネルの上に置き、ホーム・道場と同じ一歩を指す。試験は入口として見せ、
 * 記録の無い模試を「先に試す」入口として添える。練習は 1 つずつ並べない —
 * すぐ下の「関連する練習」と同じ練習が 2 度出る。
 */
export function RankGoalPanel({
  rankSlug,
  examSlug,
  progress,
}: {
  readonly rankSlug: RankSlug;
  /** その級の昇級試験 */
  readonly examSlug: PracticeMenuSlug;
  /** その級の行程の進み具合（道場の行程カードと同じ数え方） */
  readonly progress: RankProgress | undefined;
}) {
  const t = useTranslations("lessons.rankGoal");
  const tRanks = useTranslations("ranks");
  const tAll = useTranslations();
  const router = useRouter();
  const rank = tRanks(`names.${rankSlug}`);

  return (
    <FollowUpPanel title={t("title", { rank })} testID="rank-goal-panel">
      <Text style={styles.lead}>{t("lead", { rank })}</Text>
      {progress !== undefined && (
        <View style={styles.progress} testID="rank-progress">
          <ProgressItem
            label={tRanks("stages.learn")}
            value={tRanks("stageCount", { ...progress.learn })}
          />
          <ProgressItem
            label={tRanks("stages.practice")}
            value={tRanks("stageCount", { ...progress.practice })}
          />
          <ProgressItem
            label={tRanks("stages.exam")}
            value={tRanks(
              progress.examPassed ? "stageExamPassed" : "stageExamNotPassed",
            )}
          />
        </View>
      )}
      <LinkRowList inset>
        <LinkRow
          onPress={() => router.push(practiceHref(examSlug))}
          title={journeyStepTitle({ kind: "exam", slug: examSlug }, tAll)}
          description={t("examDescription")}
        />
      </LinkRowList>
      <View style={styles.links}>
        <TextLink onPress={() => router.push(practiceTrainingHref(examSlug))}>
          {t("training")}
        </TextLink>
        <TextLink onPress={() => router.push(DOJO_PATH)}>{t("dojo")}</TextLink>
      </View>
    </FollowUpPanel>
  );
}

/** 進み具合の 1 項目（段の名前と値） */
function ProgressItem({
  label,
  value,
}: {
  readonly label: string;
  readonly value: string;
}) {
  return (
    <Text style={styles.progressItem}>
      <Text style={styles.progressLabel}>{label} </Text>
      {value}
    </Text>
  );
}

const styles = StyleSheet.create({
  lead: {
    fontSize: 15,
    lineHeight: 24,
    color: colors.surface700,
  },
  progress: {
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: 16,
    rowGap: 4,
  },
  progressItem: {
    fontSize: 13,
    fontVariant: ["tabular-nums"],
    color: colors.surface600,
  },
  progressLabel: {
    fontWeight: "700",
  },
  links: {
    alignItems: "center",
    gap: 4,
  },
});
