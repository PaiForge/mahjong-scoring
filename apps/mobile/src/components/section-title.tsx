import { StyleSheet, Text, View } from "react-native";

import { colors, radius } from "../lib/theme";

/**
 * 節の見出し（web の `SectionTitle`）
 *
 * 左の短い縦線・文字・右へ伸びる淡い横線で内容を穏やかに区切る。段級位の
 * 節（試験の合格条件・昇級試験の案内）は縦線に帯色を渡す — 既定の緑のままだと、
 * 隣の帯色の枠と競合して緑がその級の色に見えるため。
 */
export function SectionTitle({
  children,
  accentColor = colors.primary600,
}: {
  readonly children: string;
  /** 左の縦線の色。省略時は緑 */
  readonly accentColor?: string;
}) {
  return (
    <View style={styles.row}>
      <View style={[styles.accent, { backgroundColor: accentColor }]} />
      <Text accessibilityRole="header" style={styles.text}>
        {children}
      </Text>
      <View style={styles.rule} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 4,
  },
  accent: {
    width: 4,
    height: 16,
    borderRadius: radius.full,
  },
  text: {
    flexShrink: 1,
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.4,
    color: colors.foreground,
  },
  rule: {
    flex: 1,
    minWidth: 16,
    height: 1,
    backgroundColor: colors.panel,
  },
});
