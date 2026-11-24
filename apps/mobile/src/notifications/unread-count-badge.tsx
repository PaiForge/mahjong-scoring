import { StyleSheet, Text, View } from "react-native";

import { colors } from "../lib/theme";

/** これを超える未読数は「99+」にまとめる（web のベルと同じ。バッジが横に伸びないように） */
const MAX_BADGE_COUNT = 99;

/**
 * 未読の通知の件数のバッジ（web のヘッダーのベルの数字）
 * 未読数バッジ
 *
 * アプリはヘッダーにベルを置かず、マイページの「通知」の行末と、ホームの
 * ヘッダーのアバターの右上（`size="sm"`。アバターに重ねるので一回り小さく）に
 * これを出す。色は web のベルと同じ赤の塗り。読み上げは置き場所の名前
 * （「通知（未読 N 件）」等）が持つので、ここは読ませない。
 */
export function UnreadCountBadge({
  count,
  size = "md",
}: {
  readonly count: number;
  readonly size?: "sm" | "md";
}) {
  return (
    <View
      testID="notifications-unread-badge"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.badge, size === "sm" && styles.badgeSm]}
    >
      <Text style={[styles.label, size === "sm" && styles.labelSm]}>
        {count > MAX_BADGE_COUNT ? `${MAX_BADGE_COUNT}+` : count}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.destructive,
  },
  // 地（ヘッダーのガラス・アバター）から切り離す白い縁。状態の印なので 2px
  badgeSm: {
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: colors.white,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.white,
    fontVariant: ["tabular-nums"],
  },
  labelSm: {
    fontSize: 10,
  },
});
