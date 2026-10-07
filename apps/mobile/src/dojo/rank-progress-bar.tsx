import { StyleSheet, Text, View } from "react-native";
import { useTranslations } from "use-intl";
import { buildRankProgress } from "@mahjong-scoring/features/ranks/rank-progress";
import type { RankSlug } from "@mahjong-scoring/features/ranks/registry";

import { RANK_BELT_COLORS } from "../lib/belt-colors";
import { colors, radius } from "../lib/theme";

/**
 * 5級から初段（黒帯）までの段級位の進み具合を示す区切り付きのバー（web の `RankProgressBar`）
 * 段級位進捗バー
 *
 * 道場の先頭に置き、「現在の段級位」のラベル行の下に級ごとの区切りを並べる。
 * 取得済みの区切りはその級の帯色、次の目標の級は帯色の淡い側、残りは
 * 淡いグレー。区切りの状態は web と同じ `buildRankProgress` から引く。
 *
 * @param currentSlug 現在の段級位。未取得（無級）なら undefined
 */
export function RankProgressBar({
  currentSlug,
}: {
  readonly currentSlug: RankSlug | undefined;
}) {
  const t = useTranslations("dojo");
  const tRanks = useTranslations("ranks");
  const { achievedCount, totalCount, segments } =
    buildRankProgress(currentSlug);
  const currentName =
    currentSlug === undefined ? t("unranked") : tRanks(`names.${currentSlug}`);

  return (
    <View style={styles.root}>
      <View style={styles.labels}>
        <View style={styles.current}>
          <Text accessibilityRole="header" style={styles.currentLabel}>
            {t("currentRankTitle")}
          </Text>
          <Text style={styles.currentName}>{currentName}</Text>
        </View>
        <Text style={styles.count}>
          {t("rankProgress", { done: achievedCount, total: totalCount })}
        </Text>
      </View>
      <View
        style={styles.segments}
        accessibilityRole="progressbar"
        accessibilityLabel={t("currentRankTitle")}
        accessibilityValue={{
          min: 0,
          max: totalCount,
          now: achievedCount,
          text: t("rankProgressValue", {
            rank: currentName,
            done: achievedCount,
            total: totalCount,
          }),
        }}
      >
        {segments.map(({ slug, state, isCurrent }) => (
          <View key={slug} style={styles.segment}>
            <View
              style={[
                styles.track,
                {
                  backgroundColor:
                    state === "achieved"
                      ? RANK_BELT_COLORS[slug].fill
                      : state === "next"
                        ? RANK_BELT_COLORS[slug].tint
                        : colors.surface100,
                },
              ]}
            />
            <Text
              style={[styles.segmentName, isCurrent && styles.segmentCurrent]}
            >
              {tRanks(`names.${slug}`)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: 8,
  },
  labels: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 12,
  },
  current: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
    flexShrink: 1,
  },
  currentLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.surface500,
  },
  currentName: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.surface900,
  },
  count: {
    fontSize: 12,
    fontVariant: ["tabular-nums"],
    color: colors.surface600,
  },
  segments: {
    flexDirection: "row",
    gap: 4,
  },
  segment: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    gap: 4,
  },
  track: {
    alignSelf: "stretch",
    height: 8,
    borderRadius: radius.full,
  },
  segmentName: {
    fontSize: 12,
    color: colors.surface500,
  },
  segmentCurrent: {
    fontWeight: "700",
    color: colors.surface900,
  },
});
