import { StyleSheet, Text, View } from "react-native";
import type { ExpInfo } from "@mahjong-scoring/core";
import { useTranslations } from "use-intl";

import { Chip } from "../../components/chip";
import { colors, radius } from "../../lib/theme";

/**
 * 獲得した経験値・レベル・レベル内の進み具合（web の `ExpGainDisplay`）
 * 経験値獲得表示
 *
 * 結果画面の結果の節の中に行として置く。外枠も見出しも持たない（web も
 * 記録の節の中でフラットに描く）。進み具合の帯は表示だけなので影も枠も
 * 付けず、正解・不正解の帯（`ResultScoreBar`）と同じ淡い地に緑で塗る。
 */
export function ExpGain({ exp }: { readonly exp: ExpInfo }) {
  const t = useTranslations("exp");
  const { earnedExp, level, levelUp, progressPercent } = exp;

  return (
    <View style={styles.root} testID="exp-gain">
      <View style={styles.header}>
        <Text style={styles.level}>{t("level", { level })}</Text>
        <Text style={styles.earned}>{t("earned", { amount: earnedExp })}</Text>
      </View>
      <View style={styles.progress}>
        <Text style={styles.percent}>{progressPercent}%</Text>
        <View
          style={styles.track}
          accessibilityRole="progressbar"
          accessibilityLabel={t("label")}
          accessibilityValue={{ min: 0, max: 100, now: progressPercent }}
        >
          <View style={[styles.fill, { width: `${progressPercent}%` }]} />
        </View>
      </View>
      {levelUp && <Chip tone="primary">{t("levelUp")}</Chip>}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  level: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.surface900,
  },
  earned: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.primary600,
  },
  progress: {
    gap: 6,
  },
  percent: {
    alignSelf: "flex-end",
    fontSize: 12,
    color: colors.surface500,
  },
  track: {
    height: 8,
    borderRadius: radius.full,
    overflow: "hidden",
    backgroundColor: colors.surface100,
  },
  fill: {
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.primary500,
  },
});
