import { StyleSheet, Text, View } from "react-native";

import { colors } from "../lib/theme";

/** これを超える未読数は「99+」にまとめる（web のベルと同じ。バッジが横に伸びないように） */
const MAX_BADGE_COUNT = 99;

/**
 * 未読の通知の件数のバッジ（web のヘッダーのベルの数字）
 * 未読数バッジ
 *
 * アプリはヘッダーにベルを置かず、マイページの「通知」の行末にこれを出す。
 * 色は web のベルと同じ赤の塗り。読み上げは行の名前（「通知（未読 N 件）」）が
 * 持つので、ここは読ませない。
 */
export function UnreadCountBadge({ count }: { readonly count: number }) {
  return (
    <View
      testID="notifications-unread-badge"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={styles.badge}
    >
      <Text style={styles.label}>
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
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.white,
    fontVariant: ["tabular-nums"],
  },
});
