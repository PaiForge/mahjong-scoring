import { StyleSheet, Text, View } from "react-native";
import { useTranslations } from "use-intl";
import type { RankStatus } from "@mahjong-scoring/features/ranks/rank-status";

import { CheckIcon } from "../components/icons/icons";
import { lessonColors } from "../lessons/lesson-colors";
import { colors } from "../lib/theme";

/** 状態ごとの pill の塗りと文字色（web の `STATUS_CLASSES`）。枠は持たない */
const STATUS_COLORS: Readonly<
  Record<RankStatus, { readonly bg: string; readonly fg: string }>
> = {
  achieved: { bg: colors.successSubtle, fg: colors.primary900 },
  next: { bg: lessonColors.amber200Solid, fg: lessonColors.amber900 },
  unachieved: { bg: colors.surface100, fg: colors.surface600 },
};

/**
 * 段級位の取得状態の pill（取得済み / 次の目標 / 未取得。web の `RankStatusBadge`）
 * 段級位状態バッジ
 *
 * 状態は色だけでなく文字でも示す。「次の目標」の琥珀色はレッスンの目次の
 * 「次はここから」と同じ記号。
 */
export function RankStatusBadge({ status }: { readonly status: RankStatus }) {
  const t = useTranslations("dojo");
  const { bg, fg } = STATUS_COLORS[status];
  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      {status === "achieved" && <CheckIcon size={14} color={fg} />}
      <Text style={[styles.label, { color: fg }]}>{t(`status.${status}`)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    height: 24,
    borderRadius: 9999,
    paddingHorizontal: 10,
    flexShrink: 0,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
  },
});
